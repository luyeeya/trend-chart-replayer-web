'use client';

type ConfirmPopupProps = {
  contract: string;
  price: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmPopup({ contract, price, onConfirm, onCancel }: ConfirmPopupProps) {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded shadow-lg p-6 z-50">
      <p>期货合约: {contract}</p>
      <p>价格: {price}</p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onConfirm}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors"
        >
          确定
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}