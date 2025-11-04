import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/axios';

declare global {
  interface Window {
    TossPayments?: any;
  }
}

type Checkout = {
  id?: number;
  orderId: string;
  name: string;
  address: string;
  phone: string;
  quantity: number;
  amount?: number; // 서버가 계산/확정해서 내려주는 최종 결제금액
};

type Summary = {
  items: Array<{ capName: string; price: number; quantity: number }>;
  totalCount: number;
  totalPrice: number;
};

export default function PaymentPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const checkoutId = params.get('checkoutId') || '';
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  // TossPayments
  const [tossReady, setTossReady] = useState(false);
  const tossWidgetsRef = useRef<any>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // 금액 보정: 음수/NaN 방지 + 원단위 내림
  const clampKRW = (v: number) => Math.max(0, Math.floor(v || 0));

  // 체크아웃 로드
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!checkoutId) {
        setError('checkoutId가 없습니다.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await api.get(
          `${import.meta.env.DEV ? 'http://localhost:8080' : ''}/api/checkout/${encodeURIComponent(checkoutId)}`,
          { validateStatus: (s) => s >= 200 && s < 300 }
        );
        if (!ignore) setCheckout(res.data as Checkout);
      } catch (e: any) {
        if (!ignore) setError(e?.response?.data?.message || '체크아웃 정보를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [checkoutId]);

  // 요약 정보 복원 (state 우선, 없으면 sessionStorage)
  useEffect(() => {
    const s = (location.state as any) || null;
    if (s?.items) {
      console.log('PaymentPage - summary from state:', s);
      setSummary({ items: s.items, totalCount: s.totalCount, totalPrice: s.totalPrice });
      return;
    }
    if (checkoutId) {
      try {
        const raw = sessionStorage.getItem(`checkout:${checkoutId}:summary`);
        if (raw) {
          const parsed = JSON.parse(raw);
          console.log('PaymentPage - summary from sessionStorage:', parsed);
          setSummary(parsed);
        }
      } catch {}
    }
  }, [location.state, checkoutId]);

  // TossPayments 스크립트 로드
  useEffect(() => {
    if (window.TossPayments) {
      setTossReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    script.onload = () => setTossReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // TossPayments 위젯 초기 렌더 (한 번만)
  useEffect(() => {
    if (!tossReady || !checkout || !summary || !paymentMethodRef.current || !agreementRef.current) return;
    if (tossWidgetsRef.current) return; // 중복 렌더 방지

    const TossPayments = (window as any).TossPayments;
    const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'; // TODO: 운영키로 교체
    const customerKey = 'guest-or-member-id'; // TODO: 로그인/비회원 정책에 맞게 설정

    const tossPayments = TossPayments(clientKey);
    const widgets = tossPayments.widgets({ customerKey });
    tossWidgetsRef.current = widgets;

    // 금액의 단일 출처 = summary.totalPrice (프론트에서 계산한 금액)
    const paymentAmount = clampKRW(summary.totalPrice ?? 0);
    console.log('TossPayments 위젯 초기화 - 결제 금액:', paymentAmount);
    
    widgets.setAmount({
      currency: 'KRW',
      value: paymentAmount,
    });

    (async () => {
      await widgets.renderPaymentMethods({
        selector: '#payment-method',
        variantKey: 'DEFAULT',
      });
      await widgets.renderAgreement({
        selector: '#agreement',
        variantKey: 'AGREEMENT',
      });
    })();
  }, [tossReady, checkout, summary]); // checkout과 summary가 준비되면 초기화

  // summary.totalPrice가 바뀌면 위젯 금액 동기화
  useEffect(() => {
    if (!tossWidgetsRef.current || typeof summary?.totalPrice !== 'number') return;
    const paymentAmount = clampKRW(summary.totalPrice);
    console.log('TossPayments 위젯 금액 업데이트:', paymentAmount);
    tossWidgetsRef.current.setAmount({
      currency: 'KRW',
      value: paymentAmount,
    });
  }, [summary?.totalPrice]);

  // 결제 버튼
  const handleTossPay = async () => {
    if (!tossWidgetsRef.current || !checkout) return;

    await tossWidgetsRef.current.requestPayment({
      orderId: checkout.orderId,
      orderName: summary?.items?.map((it) => it.capName).join(', ') || '주문',
      successUrl: window.location.origin + '/success', // ✅ React Router 경로로 변경
      failUrl: window.location.origin + '/fail',       // ✅ React Router 경로로 변경
      customerEmail: 'customer123@gmail.com',               // TODO: 실제 데이터
      customerName: checkout.name,
      customerMobilePhone: checkout.phone,
    });
  };

  return (
    <div className="min-h-screen bg-gray-400">
      <div className="max-w-lg mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-6">결제</h2>

      {!checkoutId && (
        <p className="text-red-600">checkoutId가 없습니다. 이전 단계에서 다시 시도해주세요.</p>
      )}

      {loading ? (
        <div className="text-slate-500">로딩 중...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : checkout ? (
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            체크아웃 ID: <span className="font-mono">{checkoutId}</span>
          </div>

          <div className="border rounded-lg p-4 bg-slate-50">
            <div className="font-semibold mb-2">주문 정보</div>
            <div className="flex justify-between text-sm"><span>수령인</span><span>{checkout.name}</span></div>
            <div className="flex justify-between text-sm"><span>연락처</span><span>{checkout.phone}</span></div>
            <div className="flex justify-between text-sm">
              <span>주소</span>
              <span className="text-right max-w-[60%] break-words">{checkout.address}</span>
            </div>
            <div className="flex justify-between text-sm"><span>총 수량</span><span>{checkout.quantity}개</span></div>

            {/* 화면 표시도 서버 금액 기준 */}
            {typeof checkout.amount === 'number' && (
              <div className="flex justify-between font-bold mt-2 text-lg">
                <span>총 결제 금액</span>
                <span>{clampKRW(checkout.amount).toLocaleString()}원</span>
              </div>
            )}
          </div>

          {/* 상품 요약: 표시는 가능하지만 금액 기준은 서버 amount */}
          {summary && summary.items?.length > 0 && (
            <div className="border rounded-lg p-4 bg-white">
              <div className="font-semibold mb-2">상품 내역</div>
              <ul className="space-y-1 text-sm">
                {summary.items.map((it, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{it.capName} × {it.quantity}</span>
                    <span>{(it.price * it.quantity).toLocaleString()}원</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
                <span>총 수량</span>
                <span>{summary.totalCount}개</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>클라이언트 계산 합계(참고)</span>
                <span>{summary.totalPrice.toLocaleString()}원</span>
              </div>
            </div>
          )}

          {/* TossPayments 결제 UI */}
          <div ref={paymentMethodRef} id="payment-method" />
          <div ref={agreementRef} id="agreement" />

          <button
            onClick={handleTossPay}
            className="w-full py-2 rounded font-semibold bg-blue-700 text-white mt-6 disabled:opacity-50"
            disabled={!tossReady || !checkout}
          >
            결제하기
          </button>

          <div className="text-center">
            <a href="/" className="text-blue-700 underline">홈으로 돌아가기</a>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
