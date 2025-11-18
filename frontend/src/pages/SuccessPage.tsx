import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const qp = useMemo(() => searchParams.toString(), [searchParams]); // ✅ deps용 고정 문자열
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [orderIdResult, setOrderIdResult] = useState<number | null>(null);

  const hasConfirmed = useRef(false);     // 결제 승인 중복 방지
  

  // 1) 결제 승인
  useEffect(() => {
    if (hasConfirmed.current) return;
    hasConfirmed.current = true;

    const sp = new URLSearchParams(qp);
    const paymentKey = sp.get('paymentKey');
    const orderId = sp.get('orderId');
    let amount = sp.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setMessage('결제 정보가 누락되었습니다.');
      return;
    }

    (async () => {
      try {
        // 결제 추적/할인 정보 반영
        const paymentInfoStr = sessionStorage.getItem(`payment:${orderId}`);
        const discountInfoStr = sessionStorage.getItem(`discount:${orderId}`);
        if (paymentInfoStr) {
          const paymentInfo = JSON.parse(paymentInfoStr);
          amount = String(paymentInfo.finalAmount);
        }

        const requestData: any = { paymentKey, orderId, amount };
        if (discountInfoStr) requestData.discountInfo = JSON.parse(discountInfoStr);

        const res = await api.post(
          `${import.meta.env.DEV ? 'http://localhost:8080' : ''}/api/orders/confirm`,
          requestData
        );

        setOrderIdResult(res.data.orderId || res.data.id);
        setStatus('success');
        setMessage('결제가 완료되었습니다!');

        // 세션 정리
        sessionStorage.removeItem(`payment:${orderId}`);
        sessionStorage.removeItem(`discount:${orderId}`);
        sessionStorage.removeItem(`checkout:${orderId}:summary`);
      } catch (err: any) {
        console.error('결제 승인 오류:', err?.response?.data || err);
        setStatus('error');
        setMessage(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          '결제 승인 중 오류가 발생했습니다.'
        );
      }
    })();
  }, [qp]);


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
