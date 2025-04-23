import React, { useState, useRef } from 'react';

interface StepSelectorProps {
    initialStep: number; // 初始步频值
    onStepChange?: (step: number) => void; // 回调函数
}

export default function StepSelector({ initialStep, onStepChange }: StepSelectorProps) {
    const [selectedButton, setSelectedButton] = useState<string>(initialStep.toString());

    const handleButtonClick = (step: string) => {
        setSelectedButton(step);

        // 调用回调函数，通知父组件步频值的变化
        if (onStepChange) {
            const newStep = parseInt(step, 10);
            onStepChange(newStep);
        }
    };

    return (
        <div className='flex items-center gap-1 justify-center'>
            {/* 步频标签 */}
            <label className='text-sm text-gray-500 whitespace-nowrap'>步频:</label>
            {['1', '5', '10'].map((step) => (
                <button
                    key={step}
                    onClick={() => handleButtonClick(step)}
                    className='flex-shrink-0 px-3 py-1 bg-gray-100 text-black rounded-md cursor-pointer 
                       hover:bg-gray-200 transition-colors duration-200 
                       text-sm font-medium'
                    style={{
                        backgroundColor: selectedButton === step ? '#4CAF50' : '#f1f1f1',
                        color: selectedButton === step ? '#fff' : '#000',
                    }}
                >
                    {step}
                </button>
            ))}
        </div>
    );
}