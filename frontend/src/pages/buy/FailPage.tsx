import { useNavigate, useSearchParams } from 'react-router-dom';

export default function FailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h2>
      <p className="text-slate-600 mb-2">{message || '결제가 취소되었습니다.'}</p>
      {code && <p className="text-sm text-slate-500 mb-6">오류 코드: {code}</p>}
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-slate-900 text-white rounded"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
