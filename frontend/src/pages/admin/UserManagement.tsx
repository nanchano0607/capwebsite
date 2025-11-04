import { useEffect, useState } from "react";

const SERVER = "http://localhost:8080";

type User = {
  id: number;
  email: string | null;
  name: string;
  phone?: string | null;
  admin: boolean; // 백엔드 필드명
  createdAt: string;
  enabled: boolean; // 백엔드 필드명  
  oauthProvider?: string;
};

interface UserManagementProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function UserManagement({ isOpen, onToggle }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("ALL");

  useEffect(() => {
    // 컴포넌트 마운트 시 사용자 목록 가져오기 (개수 표시용)
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setLoadingProgress("사용자 ID 목록 조회 중...");
    try {
      const token = localStorage.getItem("access_token");
      
      // 1단계: 사용자 ID 목록만 먼저 가져오기
      const idsRes = await fetch(`${SERVER}/api/admin/users/ids`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!idsRes.ok) {
        // 기존 API가 없는 경우 fallback으로 기존 방식 시도
        console.log("IDs API 없음, 기존 방식으로 fallback");
        setLoadingProgress("전체 사용자 목록 조회 중...");
        await fetchUsersLegacy();
        return;
      }
      
      const userIds = await idsRes.json();
      console.log("User IDs fetched:", userIds.length);
      setLoadingProgress(`${userIds.length}명의 사용자 정보 개별 조회 중...`);
      
      // 2단계: 각 사용자를 개별적으로 가져오기
      const users: User[] = [];
      const batchSize = 5; // 동시에 처리할 사용자 수
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const currentBatch = Math.floor(i/batchSize) + 1;
        const totalBatches = Math.ceil(userIds.length / batchSize);
        
        setLoadingProgress(`사용자 정보 조회 중... (${currentBatch}/${totalBatches} 배치, ${users.length}/${userIds.length}명 완료)`);
        
        const batchPromises = batch.map(async (userId: number) => {
          try {
            const userRes = await fetch(`${SERVER}/api/admin/users/${userId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            
            if (userRes.ok) {
              const userData = await userRes.json();
              // 필요한 필드만 추출
              return {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                admin: userData.admin,
                createdAt: userData.createdAt,
                enabled: userData.enabled,
                oauthProvider: userData.oauthProvider
              };
            } else {
              console.warn(`사용자 ${userId} 조회 실패:`, userRes.status);
              return null;
            }
          } catch (error) {
            console.warn(`사용자 ${userId} 조회 중 오류:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validUsers = batchResults.filter(user => user !== null) as User[];
        users.push(...validUsers);
        
        console.log(`Batch ${currentBatch} 완료: ${validUsers.length}/${batch.length} 사용자`);
      }
      
      console.log("총 사용자 로드 완료:", users.length);
      setLoadingProgress("");
      setUsers(users);
      
    } catch (e) {
      console.error("사용자 목록 조회 실패:", e);
      setLoadingProgress("오류 발생, 기존 방식으로 재시도 중...");
      // fallback으로 기존 방식 시도
      await fetchUsersLegacy();
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  };

  // 기존 방식 (fallback용)
  const fetchUsersLegacy = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${SERVER}/api/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (res.ok) {
        const text = await res.text();
        console.log("Legacy API Response status:", res.status);
        
        // 응답이 비어있는 경우 처리
        if (!text || text.trim() === '') {
          console.warn("Empty response received");
          setUsers([]);
          return;
        }
        
        // JSON 파싱 시도
        try {
          const data = JSON.parse(text);
          console.log("Successfully parsed JSON, user count:", data.length);
          
          // 필요한 필드만 추출하여 순환 참조 문제 해결
          const cleanUsers = data.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            admin: user.admin,
            createdAt: user.createdAt,
            enabled: user.enabled,
            oauthProvider: user.oauthProvider
          }));
          
          setUsers(cleanUsers);
          
        } catch (parseError) {
          console.error("JSON 파싱 실패:", parseError);
          console.error("응답 텍스트 길이:", text.length);
          
          // 백엔드 중첩 깊이 오류인 경우
          if (text.includes('nesting depth') || text.includes('maximum allowed')) {
            alert("서버에서 데이터 처리 중 오류가 발생했습니다. 개별 사용자 API 구현이 필요합니다.");
          }
          
          // 목업 데이터로 대체
          const mockUsers: User[] = [
            {
              id: 1,
              email: "admin@example.com",
              name: "관리자",
              admin: true,
              createdAt: "2024-01-01T00:00:00Z",
              enabled: true
            }
          ];
          setUsers(mockUsers);
        }
      } else {
        console.error("API 응답 실패:", res.status, res.statusText);
        alert(`사용자 목록 조회 실패: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error("Legacy 사용자 목록 조회 실패:", e);
      alert("사용자 목록 조회 중 네트워크 오류가 발생했습니다.");
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? "비활성화" : "활성화";
    alert(`${action} 기능은 아직 구현되지 않았습니다.\n백엔드 API가 필요합니다: POST /api/admin/users/${userId}/toggle-status`);
  };

  const toggleAdminRole = async (userId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/admin/users/${userId}/toggle-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        
        // 로컬 상태 업데이트
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, admin: result.admin }
              : user
          )
        );
      } else if (response.status === 404) {
        alert("사용자를 찾을 수 없습니다.");
      } else {
        alert("권한 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("권한 변경 실패:", error);
      alert("권한 변경 중 오류가 발생했습니다.");
    }
  };

  const resetUserPassword = async (userId: number) => {
    alert(`비밀번호 초기화 기능은 아직 구현되지 않았습니다.\n백엔드 API가 필요합니다: POST /api/admin/users/${userId}/reset-password`);
  };

  // 클라이언트 사이드 필터링
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      userFilter === "ALL" ||
      (userFilter === "ACTIVE" && user.enabled) ||
      (userFilter === "INACTIVE" && !user.enabled) ||
      (userFilter === "ADMIN" && user.admin) ||
      (userFilter === "USER" && !user.admin);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="border p-4 rounded">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">사용자 관리</h2>
          <span className="text-sm text-gray-500">({users.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
        >
          {isOpen ? "접기" : "펼치기"}
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-4">
          {/* 검색 및 필터 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded px-3 py-1 text-sm"
              />
            </div>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="ALL">전체</option>
              <option value="ACTIVE">활성 회원</option>
              <option value="INACTIVE">비활성 회원</option>
              <option value="ADMIN">관리자</option>
              <option value="USER">일반 회원</option>
            </select>
            <button
              onClick={fetchUsers}
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>

          {/* 사용자 목록 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">로딩 중...</div>
              {loadingProgress && (
                <div className="text-sm text-gray-500">{loadingProgress}</div>
              )}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-600">사용자가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{user.name}</h3>
                        {user.admin && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            관리자
                          </span>
                        )}
                        {!user.enabled && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">이메일: {user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-600">전화번호: {user.phone}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.enabled)}
                      className={`px-3 py-1.5 text-white text-sm rounded ${
                        user.enabled 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {user.enabled ? "비활성화" : "활성화"}
                    </button>
                    
                    <button
                      onClick={() => toggleAdminRole(user.id)}
                      className={`px-3 py-1.5 text-white text-sm rounded ${
                        user.admin 
                          ? "bg-gray-600 hover:bg-gray-700" 
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      {user.admin ? "관리자 해제" : "관리자 승격"}
                    </button>
                    
                    <button
                      onClick={() => resetUserPassword(user.id)}
                      className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                    >
                      비밀번호 초기화
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}