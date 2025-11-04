import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [orderIdResult, setOrderIdResult] = useState<number | null>(null);
  const hasConfirmed = useRef(false); // 중복 요청 방지

  useEffect(() => {
    async function confirmPayment() {
      // 이미 처리했으면 스킵
      if (hasConfirmed.current) return;
      hasConfirmed.current = true;

      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setMessage('결제 정보가 누락되었습니다.');
        return;
      }

      console.log('결제 승인 요청 데이터:', { paymentKey, orderId, amount: Number(amount) });

      try {
        const token = localStorage.getItem('access_token');
        console.log('토큰 존재 여부:', !!token);
        
        const res = await api.post(
          `${import.meta.env.DEV ? 'http://localhost:8080' : ''}/api/orders/confirm`,
          {
            paymentKey,
            orderId,
            amount: amount  // 문자열 그대로 전송 (서버에서 파싱)
          }
        );

        console.log('결제 승인 응답:', res.data);
        setOrderIdResult(res.data.orderId || res.data.id);
        setStatus('success');
        setMessage('결제가 완료되었습니다!');
        
        // CheckOut sessionStorage 정리
        sessionStorage.removeItem(`checkout:${orderId}:summary`);
      } catch (err: any) {
        console.error('결제 승인 오류:', err);
        console.error('응답 데이터:', err?.response?.data);
        setStatus('error');
        setMessage(err?.response?.data?.error || err?.response?.data?.message || '결제 승인 중 오류가 발생했습니다.');
      }
    }

    confirmPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">결제 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h2>
        <p className="mb-6">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-slate-900 text-white rounded"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-4">결제 완료!</h2>
      <p className="text-slate-600 mb-6">{message}</p>
      {orderIdResult && (
        <p className="text-sm text-slate-500 mb-6">주문번호: #{orderIdResult}</p>
      )}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/account')}
          className="px-6 py-2 bg-blue-700 text-white rounded"
        >
          주문 내역 보기
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-slate-200 text-slate-900 rounded"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
