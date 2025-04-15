'use client';

type OrderPopupProps = {
  position: { top: number; left: number };
  onBuy: () => void;
  onSell: () => void;
  onClose: () => void;
};

export default function OrderPopup({ position, onBuy, onSell, onClose }: OrderPopupProps) {
  return (
    <div
      className="absolute bg-white border border-gray-300 rounded shadow-lg p-4 z-50"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <button
        onClick={onBuy}
        className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 transition-colors"
      >
        买多
      </button>
      <button
        onClick={onSell}
        className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600 transition-colors"
      >
        卖空
      </button>
      <button
        onClick={onClose}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
      >
        平仓
      </button>
    </div>
  );
}