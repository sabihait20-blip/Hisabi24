import { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';

export function Calculator({ onBack }: { onBack: () => void }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (display === 'Error') {
      setDisplay(num);
      setIsNewNumber(false);
      return;
    }
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    
    if (equation && !isNewNumber) {
      try {
        const expression = (equation + display).replace(/×/g, '*').replace(/÷/g, '/');
        const result = new Function('return ' + expression)();
        const formattedResult = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString();
        setDisplay(formattedResult);
        setEquation(formattedResult + ' ' + op + ' ');
      } catch (e) {
        setDisplay('Error');
      }
    } else if (equation && isNewNumber) {
      setEquation(equation.slice(0, -3) + ' ' + op + ' ');
    } else {
      setEquation(display + ' ' + op + ' ');
    }
    setIsNewNumber(true);
  };

  const calculate = () => {
    if (!equation || isNewNumber) return;
    try {
      const fullEquation = equation + display;
      const expression = fullEquation.replace(/×/g, '*').replace(/÷/g, '/');
      const result = new Function('return ' + expression)();
      
      const formattedResult = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString();
      
      setDisplay(formattedResult);
      setEquation('');
      setIsNewNumber(true);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    if (isNewNumber || display === 'Error') return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const handleDecimal = () => {
    if (isNewNumber || display === 'Error') {
      setDisplay('0.');
      setIsNewNumber(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handlePercentage = () => {
    if (display === 'Error') return;
    try {
      const value = parseFloat(display);
      setDisplay((value / 100).toString());
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col relative">
      <div className="bg-gray-900 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">ক্যালকুলেটর</h1>
      </div>

      <div className="flex-1 flex flex-col justify-end p-6">
        {/* Display Area */}
        <div className="flex flex-col items-end justify-end mb-6 min-h-[120px]">
          <div className="text-gray-400 text-xl h-8 mb-2 tracking-wider font-mono">
            {equation}
          </div>
          <div className={`text-6xl font-light tracking-tight text-white font-mono break-all text-right ${display.length > 10 ? 'text-4xl' : ''}`}>
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-4">
          {/* Row 1 */}
          <button onClick={handleClear} className="bg-gray-300 text-gray-900 text-2xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-400 active:bg-gray-500 transition-colors">
            C
          </button>
          <button onClick={handleDelete} className="bg-gray-300 text-gray-900 text-2xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-400 active:bg-gray-500 transition-colors">
            <Delete size={28} />
          </button>
          <button onClick={handlePercentage} className="bg-gray-300 text-gray-900 text-2xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-400 active:bg-gray-500 transition-colors">
            %
          </button>
          <button onClick={() => handleOperator('÷')} className="bg-purple-600 text-white text-3xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-purple-700 active:bg-purple-800 transition-colors">
            ÷
          </button>

          {/* Row 2 */}
          <button onClick={() => handleNumber('7')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            7
          </button>
          <button onClick={() => handleNumber('8')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            8
          </button>
          <button onClick={() => handleNumber('9')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            9
          </button>
          <button onClick={() => handleOperator('×')} className="bg-purple-600 text-white text-3xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-purple-700 active:bg-purple-800 transition-colors">
            ×
          </button>

          {/* Row 3 */}
          <button onClick={() => handleNumber('4')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            4
          </button>
          <button onClick={() => handleNumber('5')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            5
          </button>
          <button onClick={() => handleNumber('6')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            6
          </button>
          <button onClick={() => handleOperator('-')} className="bg-purple-600 text-white text-4xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-purple-700 active:bg-purple-800 transition-colors">
            -
          </button>

          {/* Row 4 */}
          <button onClick={() => handleNumber('1')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            1
          </button>
          <button onClick={() => handleNumber('2')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            2
          </button>
          <button onClick={() => handleNumber('3')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            3
          </button>
          <button onClick={() => handleOperator('+')} className="bg-purple-600 text-white text-3xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-purple-700 active:bg-purple-800 transition-colors">
            +
          </button>

          {/* Row 5 */}
          <button onClick={() => handleNumber('00')} className="bg-gray-800 text-white text-2xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            00
          </button>
          <button onClick={() => handleNumber('0')} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            0
          </button>
          <button onClick={handleDecimal} className="bg-gray-800 text-white text-3xl font-light rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors">
            .
          </button>
          <button onClick={calculate} className="bg-purple-600 text-white text-4xl font-medium rounded-full h-16 sm:h-20 flex items-center justify-center hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-lg shadow-purple-600/30">
            =
          </button>
        </div>
      </div>
    </div>
  );
}
