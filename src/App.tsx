import React, { useState, useId, useRef } from 'react';
import { Coffee, RotateCcw, CheckCircle2, AlertCircle, ShoppingBag, Clock, User, Phone, MessageSquare } from 'lucide-react';

// ==========================================
// 1. 카페 음료 및 옵션 데이터 정의
// ==========================================

// 음료 목록 및 기본 가격 정의
interface Beverage {
  id: string;
  name: string;
  price: number;
}

const BEVERAGES: Beverage[] = [
  { id: 'americano', name: '아메리카노', price: 3500 },
  { id: 'latte', name: '카페라떼', price: 4000 },
  { id: 'mocha', name: '카페모카', price: 4500 },
  { id: 'vanilla', name: '바닐라라떼', price: 4500 },
  { id: 'greentea', name: '녹차라떼', price: 4500 },
];

// 사이즈 옵션 및 추가 금액
interface SizeOption {
  id: string;
  name: string;
  extraPrice: number;
}

const SIZES: SizeOption[] = [
  { id: 'S', name: 'S', extraPrice: 0 },
  { id: 'M', name: 'M', extraPrice: 500 }, // 기본 선택
  { id: 'L', name: 'L', extraPrice: 1000 },
];

// 추가 옵션 목록 및 가격
interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'shot', name: '샷 추가', price: 500 },
  { id: 'cream', name: '크림 추가', price: 500 },
  { id: 'syrup', name: '시럽 추가', price: 300 },
  { id: 'decaf', name: '디카페인', price: 0 },
];

// 주문 내역 타입
interface OrderItem {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  beverageName: string;
  sizeName: string;
  selectedOptionsText: string;
  quantity: number;
  totalPrice: number;
  specialRequests: string;
  orderedAt: string;
}

export default function App() {
  // ==========================================
  // 2. 상태 관리 (State)
  // ==========================================

  // 1) 고객 정보 상태
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // 2) 음료 선택 상태
  const [selectedBeverageId, setSelectedBeverageId] = useState<string>('');

  // 3) 사이즈 선택 상태 (기본값 'M')
  const [selectedSizeId, setSelectedSizeId] = useState<string>('M');

  // 4) 추가 옵션 선택 상태 (배열 형태)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // 5) 수량 상태 (최소 1, 최대 10, 기본값 1)
  const [quantity, setQuantity] = useState<number>(1);

  // 6) 요청사항 상태
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // 7) 주문 완료 확인 메시지 상태
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // 8) 유효성 검사 에러 알림 상태 (이름 또는 음료 미입력 알림)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 9) 접수된 주문 게시판 목록 (카페 게시판 기능)
  const [orderBoardList, setOrderBoardList] = useState<OrderItem[]>([
    {
      id: 'demo-1',
      orderNumber: 101,
      customerName: '김바이브',
      customerPhone: '010-1234-5678',
      beverageName: '카페라떼',
      sizeName: 'M',
      selectedOptionsText: '샷 추가',
      quantity: 1,
      totalPrice: 5000,
      specialRequests: '우유 뜨겁게 부탁드려요~',
      orderedAt: '10분 전',
    },
  ]);

  // 탭 상태: 주문서 작성 vs 주문 게시판 목록
  const [activeTab, setActiveTab] = useState<'form' | 'board'>('form');

  // 입력창 포커스를 위한 Ref
  const nameInputRef = useRef<HTMLInputElement>(null);
  const beverageSelectRef = useRef<HTMLSelectElement>(null);

  // ==========================================
  // 3. 실시간 금액 계산 로직
  // ==========================================

  // 선택된 음료 정보 가져오기
  const currentBeverage = BEVERAGES.find((b) => b.id === selectedBeverageId);
  const beveragePrice = currentBeverage ? currentBeverage.price : 0;

  // 선택된 사이즈 추가 금액
  const currentSize = SIZES.find((s) => s.id === selectedSizeId);
  const sizeExtraPrice = currentSize ? currentSize.extraPrice : 0;

  // 선택된 옵션 총 추가 금액
  const optionsExtraPrice = selectedOptionIds.reduce((sum, optId) => {
    const opt = EXTRA_OPTIONS.find((o) => o.id === optId);
    return sum + (opt ? opt.price : 0);
  }, 0);

  // 1잔당 단가 (음료가 선택되지 않았으면 0원)
  const singleDrinkPrice = beveragePrice > 0 ? beveragePrice + sizeExtraPrice + optionsExtraPrice : 0;

  // 총 예상 금액 = 1잔 단가 * 수량
  const expectedTotalPrice = singleDrinkPrice * quantity;

  // ==========================================
  // 4. 이벤트 핸들러
  // ==========================================

  // 추가 옵션 체크박스 변경 핸들러
  const handleOptionChange = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  // 수량 변경 핸들러 (1 ~ 10 제한)
  const handleQuantityChange = (val: number) => {
    if (isNaN(val)) {
      setQuantity(1);
      return;
    }
    const clamped = Math.max(1, Math.min(10, val));
    setQuantity(clamped);
  };

  // 주문하기 제출 핸들러
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1) 이름 유효성 검사 (필수)
    if (!customerName.trim()) {
      setErrorMessage('이름을 입력해주세요');
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return;
    }

    // 2) 음료 선택 유효성 검사 (필수)
    if (!selectedBeverageId || !currentBeverage) {
      setErrorMessage('음료를 선택해주세요');
      if (beverageSelectRef.current) {
        beverageSelectRef.current.focus();
      }
      return;
    }

    // 선택된 옵션 텍스트 정리 (예: "샷 추가", "샷 추가, 크림 추가")
    const optionNames = selectedOptionIds
      .map((id) => EXTRA_OPTIONS.find((o) => o.id === id)?.name)
      .filter(Boolean);

    const optionText = optionNames.length > 0 ? ` (${optionNames.join(', ')})` : '';

    // 주문 확인 메시지 포맷:
    // "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
    const successMsg = `${customerName.trim()}님, ${currentBeverage.name} ${
      currentSize?.name
    }사이즈${optionText} ${quantity}잔, 총 ${expectedTotalPrice.toLocaleString()}원 주문이 접수되었습니다!`;

    setConfirmationMessage(successMsg);

    // 주문 게시판에 새 주문 추가
    const newOrder: OrderItem = {
      id: `order-${Date.now()}`,
      orderNumber: 100 + orderBoardList.length + 1,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '미입력',
      beverageName: currentBeverage.name,
      sizeName: currentSize?.name || 'M',
      selectedOptionsText: optionNames.join(', ') || '기본',
      quantity,
      totalPrice: expectedTotalPrice,
      specialRequests: specialRequests.trim() || '없음',
      orderedAt: '방금 전',
    };

    setOrderBoardList((prev) => [newOrder, ...prev]);

    // 주문 성공 후 스크롤을 확인 메시지 쪽으로 부드럽게 이동
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // 다시 작성 버튼 핸들러 (모든 입력과 금액 초기화)
  const handleReset = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSelectedBeverageId('');
    setSelectedSizeId('M');
    setSelectedOptionIds([]);
    setQuantity(1);
    setSpecialRequests('');
    setConfirmationMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#4a3525] py-8 px-4 flex flex-col items-center">
      {/* 
        [전체 디자인 가이드 준수]
        - 최대 너비 520px, 가운데 정렬 (max-w-[520px] w-full mx-auto)
        - 베이지(#faf6f0) 배경, 브라운(#6b4226) 포인트 색상
        - 둥근 모서리, 부드러운 그림자
      */}
      <div className="max-w-[520px] w-full mx-auto bg-white rounded-2xl shadow-lg border border-[#ede3d4] overflow-hidden">
        
        {/* ==========================================
            [페이지 상단]
            - 카페 로고: ☕ 이모지 크게
            - 카페 이름: "바이브 카페"
            - 부제: "당신의 하루에 바이브를 더하다"
           ========================================== */}
        <header className="bg-gradient-to-b from-[#f5ede3] to-white pt-8 pb-6 px-6 text-center border-b border-[#f0e6d8]">
          <div className="text-6xl mb-3 animate-bounce select-none" role="img" aria-label="커피 아이콘">
            ☕
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#6b4226]">
            바이브 카페
          </h1>
          <p className="text-sm text-[#8c674b] mt-1 font-medium">
            당신의 하루에 바이브를 더하다
          </p>

          {/* 탭 네비게이션: 주문서 작성 vs 실시간 주문 현황 게시판 */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-[#6b4226] text-white shadow-sm'
                  : 'bg-[#faf6f0] text-[#6b4226] hover:bg-[#ede5da]'
              }`}
            >
              <Coffee className="w-4 h-4" />
              주문서 작성
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 relative ${
                activeTab === 'board'
                  ? 'bg-[#6b4226] text-white shadow-sm'
                  : 'bg-[#faf6f0] text-[#6b4226] hover:bg-[#ede5da]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              카페 게시판
              {orderBoardList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-[#e88d43] text-white font-bold">
                  {orderBoardList.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 탭 1: 주문서 작성 폼 */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmitOrder} className="p-6 space-y-5">
            
            {/* 유효성 검사 에러 알림 메시지 배너 */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-[8px] border border-red-200 text-sm font-medium animate-shake"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. 이름 (필수, text) */}
            <div className="space-y-1.5">
              <label
                htmlFor="customer-name"
                className="block text-sm font-semibold text-[#5a3820]"
              >
                1. 이름 <span className="text-red-500 font-bold">* (필수)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="customer-name"
                  ref={nameInputRef}
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="주문자 성함을 입력해주세요"
                  className="w-full p-[10px] rounded-[8px] border border-[#d8c8b4] text-[#4a3525] placeholder-[#a89582] bg-white transition focus:outline-none focus:border-[#6b4226] focus:ring-2 focus:ring-[#6b4226]/30 text-sm"
                />
              </div>
            </div>

            {/* 2. 전화번호 (tel) */}
            <div className="space-y-1.5">
              <label
                htmlFor="customer-phone"
                className="block text-sm font-semibold text-[#5a3820]"
              >
                2. 전화번호
              </label>
              <input
                type="tel"
                id="customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-[10px] rounded-[8px] border border-[#d8c8b4] text-[#4a3525] placeholder-[#a89582] bg-white transition focus:outline-none focus:border-[#6b4226] focus:ring-2 focus:ring-[#6b4226]/30 text-sm"
              />
            </div>

            {/* 3. 음료 선택 (드롭다운) */}
            <div className="space-y-1.5">
              <label
                htmlFor="beverage-select"
                className="block text-sm font-semibold text-[#5a3820]"
              >
                3. 음료 선택 <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                id="beverage-select"
                ref={beverageSelectRef}
                value={selectedBeverageId}
                onChange={(e) => {
                  setSelectedBeverageId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full p-[10px] rounded-[8px] border border-[#d8c8b4] text-[#4a3525] bg-white transition focus:outline-none focus:border-[#6b4226] focus:ring-2 focus:ring-[#6b4226]/30 text-sm cursor-pointer"
              >
                <option value="">-- 음료를 선택해주세요 --</option>
                {BEVERAGES.map((bev) => (
                  <option key={bev.id} value={bev.id}>
                    {bev.name} ({bev.price.toLocaleString()}원)
                  </option>
                ))}
              </select>
            </div>

            {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-[#5a3820]">
                4. 사이즈
              </span>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {SIZES.map((size) => {
                  const radioId = `size-${size.id.toLowerCase()}`;
                  const isChecked = selectedSizeId === size.id;
                  return (
                    <label
                      key={size.id}
                      htmlFor={radioId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-[#6b4226] bg-[#fbf5ee] text-[#6b4226] font-semibold ring-1 ring-[#6b4226]/30'
                          : 'border-[#e0d3c4] hover:bg-[#faf6f0] text-[#553b26]'
                      }`}
                    >
                      <input
                        type="radio"
                        id={radioId}
                        name="beverage-size"
                        value={size.id}
                        checked={isChecked}
                        onChange={() => setSelectedSizeId(size.id)}
                        className="accent-[#6b4226] w-4 h-4 cursor-pointer"
                      />
                      <span>
                        {size.name} (+{size.extraPrice.toLocaleString()}원)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-[#5a3820]">
                5. 추가 옵션
              </span>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {EXTRA_OPTIONS.map((opt) => {
                  const checkId = `opt-${opt.id}`;
                  const isChecked = selectedOptionIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      htmlFor={checkId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-[#6b4226] bg-[#fbf5ee] text-[#6b4226] font-semibold ring-1 ring-[#6b4226]/30'
                          : 'border-[#e0d3c4] hover:bg-[#faf6f0] text-[#553b26]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={checkId}
                        checked={isChecked}
                        onChange={() => handleOptionChange(opt.id)}
                        className="accent-[#6b4226] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>
                        {opt.name} (+{opt.price.toLocaleString()}원)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
            <div className="space-y-1.5">
              <label
                htmlFor="order-quantity"
                className="block text-sm font-semibold text-[#5a3820]"
              >
                6. 수량 <span className="text-xs text-[#8c674b] font-normal">(최소 1, 최대 10)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-[8px] border border-[#d8c8b4] bg-white text-[#6b4226] font-bold text-lg hover:bg-[#faf6f0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="수량 감소"
                >
                  -
                </button>
                <input
                  type="number"
                  id="order-quantity"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                  className="w-24 text-center p-[10px] rounded-[8px] border border-[#d8c8b4] text-[#4a3525] bg-white font-semibold text-base transition focus:outline-none focus:border-[#6b4226] focus:ring-2 focus:ring-[#6b4226]/30"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                  className="w-10 h-10 flex items-center justify-center rounded-[8px] border border-[#d8c8b4] bg-white text-[#6b4226] font-bold text-lg hover:bg-[#faf6f0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="수량 증가"
                >
                  +
                </button>
                <span className="text-sm text-[#735137] ml-2">잔</span>
              </div>
            </div>

            {/* 7. 요청사항 (textarea) */}
            <div className="space-y-1.5">
              <label
                htmlFor="special-requests"
                className="block text-sm font-semibold text-[#5a3820]"
              >
                7. 요청사항
              </label>
              <textarea
                id="special-requests"
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="예: 덜 달게 해주세요, 얼음 조금만 넣어주세요"
                className="w-full p-[10px] rounded-[8px] border border-[#d8c8b4] text-[#4a3525] placeholder-[#a89582] bg-white transition focus:outline-none focus:border-[#6b4226] focus:ring-2 focus:ring-[#6b4226]/30 text-sm resize-none"
              />
            </div>

            {/* ==========================================
                [실시간 예상 금액 표시 영역]
                - 큰 글씨(24px), 갈색(#6b4226), 굵게, 가운데 정렬
                - 주문하기 버튼 바로 위에 배치
               ========================================== */}
            <div className="pt-3 pb-1 border-t border-dashed border-[#e6d8c8]">
              <div
                className="text-[24px] text-[#6b4226] font-bold text-center tracking-tight py-2 bg-[#fdfaf6] rounded-xl border border-[#efe5d7]"
                aria-live="polite"
              >
                예상 금액: {expectedTotalPrice.toLocaleString()}원
              </div>
            </div>

            {/* ==========================================
                8. 주문하기 버튼 & 9. 다시 작성 버튼
               ========================================== */}
            <div className="space-y-2.5 pt-1">
              {/* 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 약간 밝게 */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-[8px] bg-[#6b4226] hover:bg-[#7e4f30] active:scale-[0.99] text-white font-bold text-base shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Coffee className="w-5 h-5" />
                주문하기
              </button>

              {/* 다시 작성 버튼: 모든 입력과 금액 초기화 */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#f5efe6] hover:bg-[#ebdccb] text-[#6b4226] font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                다시 작성
              </button>
            </div>

            {/* ==========================================
                [주문 확인 메시지 영역]
                - 연두색 배경, 초록 글씨, 둥근 모서리
                - 예) "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
               ========================================== */}
            {confirmationMessage && (
              <div
                role="status"
                className="mt-6 p-4 rounded-lg bg-[#eaf7ec] text-[#1b5e20] border border-[#c4e8cb] shadow-sm flex items-start gap-3 transition-all animate-fadeIn"
              >
                <CheckCircle2 className="w-6 h-6 text-[#2e7d32] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-base mb-1">🎉 주문이 성공적으로 접수되었습니다!</p>
                  <p className="text-sm leading-relaxed text-[#256029] font-medium break-keep">
                    {confirmationMessage}
                  </p>
                  <div className="mt-3 pt-2 border-t border-[#cce8d1] flex items-center justify-between text-xs text-[#387a3e]">
                    <span>바이브 카페 카운터에서 제조 준비 중입니다.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('board')}
                      className="underline font-bold hover:text-[#1b5e20] cursor-pointer"
                    >
                      게시판에서 확인하기 &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* 탭 2: 카페 게시판 (최근 주문 내역 모아보기) */}
        {activeTab === 'board' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0e6d8] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#6b4226]">📋 카페 주문 현황 게시판</h2>
                <p className="text-xs text-[#8c674b] mt-0.5">실시간으로 접수된 바이브 카페 주문서 내역입니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#6b4226] text-white hover:bg-[#7e4f30] cursor-pointer"
              >
                + 새 주문 작성
              </button>
            </div>

            {orderBoardList.length === 0 ? (
              <div className="text-center py-12 text-[#9e8674]">
                <Coffee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">아직 접수된 주문이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderBoardList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#ede2d2] bg-[#fdfaf7] hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#6b4226] text-white">
                          주문 #{item.orderNumber}
                        </span>
                        <span className="font-bold text-[#4a3525] text-sm">
                          {item.customerName}님
                        </span>
                      </div>
                      <span className="text-xs text-[#9a7e67] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.orderedAt}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-[#f0e5d6] text-sm space-y-1">
                      <div className="flex justify-between font-semibold text-[#5a3820]">
                        <span>
                          {item.beverageName} ({item.sizeName}사이즈) &times; {item.quantity}잔
                        </span>
                        <span className="text-[#6b4226] font-bold">
                          {item.totalPrice.toLocaleString()}원
                        </span>
                      </div>
                      <div className="text-xs text-[#7e624c]">
                        <span className="font-medium text-[#9a7e67]">추가 옵션:</span>{' '}
                        {item.selectedOptionsText}
                      </div>
                      {item.specialRequests && item.specialRequests !== '없음' && (
                        <div className="text-xs text-[#8c674b] bg-[#faf6f0] p-1.5 rounded mt-1.5 flex items-start gap-1">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#6b4226]" />
                          <span>{item.specialRequests}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#8c674b]">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        연락처: {item.customerPhone}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#2e7d32] font-semibold bg-[#eaf7ec] px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        접수 완료
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 푸터 영역 */}
        <footer className="bg-[#f7f0e6] py-3 px-6 text-center text-xs text-[#8c674b] border-t border-[#ede3d4]">
          바이브 카페 (Vibe Cafe) &bull; 매일 신선하게 로스팅되는 특별한 원두
        </footer>
      </div>
    </div>
  );
}
