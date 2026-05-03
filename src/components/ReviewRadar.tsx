import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { EvaluationResult } from '../types';

interface ReviewRadarProps {
  evaluation: EvaluationResult;
}

export function ReviewRadar({ evaluation }: ReviewRadarProps) {
  const data = [
    { subject: '综合得分', A: evaluation.overallScore, fullMark: 100 },
    { subject: '沟通表达', A: evaluation.communicationScore, fullMark: 100 },
    { subject: '专业技术', A: evaluation.technicalScore, fullMark: 100 },
    { subject: '问题解决', A: evaluation.problemSolvingScore, fullMark: 100 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
