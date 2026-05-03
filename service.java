package com.ag.service;

import com.ag.common.BusinessException;
import com.ag.entity.*;
import com.ag.mapper.*;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionMapper sessionMapper;
    private final InterviewQuestionMapper questionMapper;
    private final InterviewAnswerMapper answerMapper;
    private final JobCategoryMapper jobCategoryMapper;
    private final LLMService llmService;

    /**
     * 创建面试场次 + 生成第一个问题
     */
    public Map<String, Object> createSession(Long userId, String jobCategoryId, String difficulty, int questionCount) {
        JobCategory job = jobCategoryMapper.selectById(jobCategoryId);
        String jobName = job != null ? job.getName() : "通用岗位";

        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setJobCategoryId(job != null ? job.getId() : null);
        session.setSessionTitle(jobName + "面试");
        session.setDifficulty(difficulty);
        session.setQuestionCount(questionCount);
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(LocalDateTime.now());
        sessionMapper.insert(session);

        // 生成第一个面试题
        InterviewQuestion firstQuestion = generateQuestion(session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("session", session);
        result.put("firstQuestion", firstQuestion);
        return result;
    }

    /**
     * 生成面试题
     */
    private InterviewQuestion generateQuestion(InterviewSession session) {
        // 查已有题目数确定题号
        Long count = questionMapper.selectCount(
                new LambdaQueryWrapper<InterviewQuestion>().eq(InterviewQuestion::getSessionId, session.getId())
        );
        int questionNumber = (int) (count + 1);

        String jobName = "通用";
        if (session.getJobCategoryId() != null) {
            JobCategory job = jobCategoryMapper.selectById(session.getJobCategoryId());
            if (job != null) jobName = job.getName();
        }

        String prompt = String.format(
                "你是一个资深的%s面试官。请生成第%d道面试题。\n" +
                        "岗位：%s\n难度：%s\n" +
                        "要求：题目要有深度，能考察候选人的实际能力。只输出题目内容，不要输出题号和其他信息。",
                jobName, questionNumber, jobName, session.getDifficulty()
        );

        String questionText = llmService.chat(
                "你是一个专业的面试官，只输出面试题目，不输出其他任何内容。",
                prompt
        );

        InterviewQuestion question = new InterviewQuestion();
        question.setSessionId(session.getId());
        question.setQuestionNumber(questionNumber);
        question.setQuestionText(questionText.trim());
        questionMapper.insert(question);

        return question;
    }

    /**
     * 提交答案 + 评分 + 生成下一题
     */
    public Map<String, Object> submitAnswer(Long userId, Long questionId, String userAnswer) {
        InterviewQuestion question = questionMapper.selectById(questionId);
        if (question == null) throw new BusinessException(404, "问题不存在");

        InterviewSession session = sessionMapper.selectById(question.getSessionId());
        if (session == null) throw new BusinessException(404, "面试场次不存在");
        if (!session.getUserId().equals(userId)) throw new BusinessException(403, "无权操作");

        // 保存回答
        InterviewAnswer answer = new InterviewAnswer();
        answer.setQuestionId(questionId);
        answer.setUserAnswer(userAnswer);
        answer.setAnsweredAt(LocalDateTime.now());
        answerMapper.insert(answer);

        // 评分
        try {
            String scoreResult = llmService.scoreAnswer(question.getQuestionText(), userAnswer);
            int score = extractScore(scoreResult);
            String feedback = extractFeedback(scoreResult);
            answer.setScore(score);
            answer.setFeedback(feedback);
            question.setScore(score);
            answerMapper.updateById(answer);
            questionMapper.updateById(question);
        } catch (Exception e) {
            log.warn("评分失败: {}", e.getMessage());
            answer.setScore(60);
            answer.setFeedback("评分暂不可用");
            question.setScore(60);
            answerMapper.updateById(answer);
            questionMapper.updateById(question);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answer", answer);

        // 是否还有下一题
        if (question.getQuestionNumber() < session.getQuestionCount()) {
            try {
                InterviewQuestion nextQuestion = generateQuestion(session);
                result.put("nextQuestion", nextQuestion);
                result.put("isLast", false);
            } catch (Exception e) {
                log.error("生成下一题失败: {}", e.getMessage());
                result.put("isLast", true);
                result.put("error", "下一题生成失败，面试提前结束");
            }
        } else {
            result.put("isLast", true);
        }

        return result;
    }

    /**
     * 完成面试，生成总结和总分
     */
    public Map<String, Object> completeSession(Long userId, Long sessionId) {
        InterviewSession session = sessionMapper.selectById(sessionId);
        if (session == null) throw new BusinessException(404, "面试场次不存在");
        if (!session.getUserId().equals(userId)) throw new BusinessException(403, "无权操作");

        List<InterviewQuestion> questions = questionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>().eq(InterviewQuestion::getSessionId, sessionId)
        );

        int totalScore = questions.stream()
                .mapToInt(q -> q.getScore() != null ? q.getScore() : 0)
                .sum();
        int avgScore = questions.isEmpty() ? 0 : totalScore / questions.size();

        // 生成总结
        StringBuilder qaBuilder = new StringBuilder();
        for (InterviewQuestion q : questions) {
            InterviewAnswer a = answerMapper.selectOne(
                    new LambdaQueryWrapper<InterviewAnswer>().eq(InterviewAnswer::getQuestionId, q.getId())
            );
            qaBuilder.append("Q").append(q.getQuestionNumber()).append(": ").append(q.getQuestionText()).append("\n");
            if (a != null) {
                qaBuilder.append("A: ").append(a.getUserAnswer()).append("\n");
                qaBuilder.append("得分: ").append(a.getScore()).append("分\n\n");
            }
        }

        String summary;
        try {
            summary = llmService.chat("你是一个专业的面试官，请根据面试问答记录给出综合评价和改进建议。",
                    "以下是" + session.getSessionTitle() + "的面试记录（共" + questions.size() + "题，平均分" + avgScore + "）：\n\n" + qaBuilder +
                            "\n请从以下维度给出总结：\n1. 整体表现评价\n2. 优势\n3. 不足\n4. 改进建议\n5. 是否建议进入下一轮");
        } catch (Exception e) {
            summary = "面试总结生成失败：" + e.getMessage();
        }

        session.setStatus("COMPLETED");
        session.setTotalScore(avgScore);
        session.setSummary(summary);
        session.setEndedAt(LocalDateTime.now());
        sessionMapper.updateById(session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("session", session);
        result.put("questions", questions);
        return result;
    }

    /**
     * SSE 流式面试对话
     */
    public SseEmitter streamChat(Long userId, Long sessionId, String message) {
        InterviewSession session = sessionMapper.selectById(sessionId);
        if (session == null) throw new BusinessException(404, "面试场次不存在");
        if (!session.getUserId().equals(userId)) throw new BusinessException(403, "无权操作");

        SseEmitter emitter = new SseEmitter(120_000L);

        String jobName = "通用";
        if (session.getJobCategoryId() != null) {
            JobCategory job = jobCategoryMapper.selectById(session.getJobCategoryId());
            if (job != null) jobName = job.getName();
        }

        String systemPrompt = String.format(
                "你是一个%s面试官，正在进行一场%s难度的面试。请根据候选人的回答进行追问或点评。",
                jobName, session.getDifficulty()
        );

        llmService.chatStream(systemPrompt, message)
                .doOnNext(chunk -> {
                    try {
                        emitter.send(SseEmitter.event().data(chunk));
                    } catch (IOException e) {
                        log.error("SSE send error", e);
                    }
                })
                .doOnComplete(() -> {
                    try {
                        emitter.send(SseEmitter.event().data("[DONE]"));
                        emitter.complete();
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                })
                .doOnError(emitter::completeWithError)
                .subscribe();

        return emitter;
    }

    public InterviewSession getSession(Long sessionId) {
        return sessionMapper.selectById(sessionId);
    }

    public Page<InterviewSession> getHistory(Long userId, int page, int size) {
        return sessionMapper.selectPage(
                new Page<>(page, size),
                new LambdaQueryWrapper<InterviewSession>()
                        .eq(InterviewSession::getUserId, userId)
                        .orderByDesc(InterviewSession::getCreatedAt)
        );
    }

    public List<InterviewQuestion> getQuestions(Long sessionId) {
        return questionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getSessionId, sessionId)
                        .orderByAsc(InterviewQuestion::getQuestionNumber)
        );
    }

    public List<Map<String, Object>> getQuestionsWithAnswers(Long sessionId) {
        List<InterviewQuestion> questions = getQuestions(sessionId);
        return questions.stream().map(q -> {
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", q.getId());
            item.put("sessionId", q.getSessionId());
            item.put("questionNumber", q.getQuestionNumber());
            item.put("questionText", q.getQuestionText());
            item.put("score", q.getScore());

            InterviewAnswer answer = answerMapper.selectOne(
                    new LambdaQueryWrapper<InterviewAnswer>()
                            .eq(InterviewAnswer::getQuestionId, q.getId())
            );
            if (answer != null) {
                Map<String, Object> ansMap = new java.util.LinkedHashMap<>();
                ansMap.put("id", answer.getId());
                ansMap.put("userAnswer", answer.getUserAnswer());
                ansMap.put("score", answer.getScore());
                ansMap.put("feedback", answer.getFeedback());
                item.put("answer", ansMap);
            }
            return item;
        }).collect(java.util.stream.Collectors.toList());
    }

    // ========== helpers ==========

    private int extractScore(String text) {
        Matcher m = Pattern.compile("评分[：:]\\s*(\\d+)\\s*分").matcher(text);
        if (m.find()) {
            try { return Integer.parseInt(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return 70;
    }

    private String extractFeedback(String text) {
        Matcher m = Pattern.compile("评价[：:]\\s*([\\s\\S]+)").matcher(text);
        if (m.find()) return m.group(1).trim();
        return text.trim();
    }
}
