interface StatisticsProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Statistics({ isOpen, onToggle }: StatisticsProps) {
  return (
    <div className="border p-4 rounded">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">통계</h2>
        <button
          onClick={onToggle}
          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
        >
          {isOpen ? "접기" : "펼치기"}
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-4">
          <p className="text-gray-600 mb-4">매출, 주문, 방문자 통계</p>
          <div className="space-y-3">
            <div className="p-3 border rounded bg-gray-50">
              <h4 className="font-medium mb-2">구현 예정 기능</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 일별/월별/연도별 매출 통계</li>
                <li>• 주문 상태별 통계</li>
                <li>• 인기 상품 순위</li>
                <li>• 회원 가입/탈퇴 통계</li>
                <li>• 반품/교환 통계</li>
                <li>• 실시간 대시보드</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}