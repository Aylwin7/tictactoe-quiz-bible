'use client';

import { useState, useEffect } from 'react';
import questionsData from '../questions.json';
import Confetti from 'react-confetti';

type Player = 'X' | 'O' | null;
type Board = Player[][];

interface Question {
    statement: string;
    answer: boolean;
}

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<Board>([
        [null, null, null],
        [null, null, null],
        [null, null, null],
    ]);
    const [winner, setWinner] = useState<{ winner: Player | 'Draw' | null; type: 'row' | 'col' | 'diag1' | 'diag2' | null; index: number | null } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [pendingCell, setPendingCell] = useState<{ row: number; col: number } | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<'X' | 'O' | null>(null);
    const [usedCommon, setUsedCommon] = useState<number[]>([]);
    const [usedHard, setUsedHard] = useState<number[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    // Load used questions from localStorage on mount
    useEffect(() => {
        const savedCommon = localStorage.getItem('usedCommon');
        const savedHard = localStorage.getItem('usedHard');
        if (savedCommon) {
            setUsedCommon(JSON.parse(savedCommon) as number[]);
        }
        if (savedHard) {
            setUsedHard(JSON.parse(savedHard) as number[]);
        }
    }, []);

    // Save used questions to localStorage when they change
    useEffect(() => {
        localStorage.setItem('usedCommon', JSON.stringify(usedCommon));
    }, [usedCommon]);

    useEffect(() => {
        localStorage.setItem('usedHard', JSON.stringify(usedHard));
    }, [usedHard]);

    const checkWinner = (board: Board): { winner: Player | 'Draw' | null; type: 'row' | 'col' | 'diag1' | 'diag2' | null; index: number | null } => {
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                return { winner: board[i][0], type: 'row', index: i };
            }
        }
        // Check columns
        for (let j = 0; j < 3; j++) {
            if (board[0][j] && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
                return { winner: board[0][j], type: 'col', index: j };
            }
        }
        // Check diagonals
        if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return { winner: board[0][0], type: 'diag1', index: 0 };
        }
        if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return { winner: board[0][2], type: 'diag2', index: 0 };
        }
        // Check for draw
        if (board.flat().every(cell => cell !== null)) {
            return { winner: 'Draw', type: null, index: null };
        }
        return { winner: null, type: null, index: null };
    };

    const handleCellClick = (row: number, col: number) => {
        if (board[row][col] || winner?.winner) return;

        const isCenter = row === 1 && col === 1;
        const category = isCenter ? 'hard' : 'common';
        const questions = questionsData[category];
        const used = isCenter ? usedHard : usedCommon;
        const setUsed = isCenter ? setUsedHard : setUsedCommon;

        // Get available questions (not used yet)
        const availableIndices = questions
            .map((_, index) => index)
            .filter(index => !used.includes(index));

        // If no available questions, reset used questions for this category
        if (availableIndices.length === 0) {
            setUsed([]);
            // Recalculate available indices after reset
            availableIndices.push(...questions.map((_, index) => index));
        }

        // Pick a random available question
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const randomQuestion = questions[randomIndex];

        // Mark this question as used
        setUsed(prev => [...prev, randomIndex]);

        setCurrentQuestion(randomQuestion);
        setPendingCell({ row, col });
        setSelectedPlayer(null); // Reset selection
        setShowModal(true);
    };

    const handleAnswer = (userAnswer: boolean) => {
        if (!currentQuestion || !pendingCell || !selectedPlayer) return;

        setShowModal(false);
        setCurrentQuestion(null);
        setSelectedPlayer(null);

        if (userAnswer === currentQuestion.answer) {
            // Correct answer
            const { row, col } = pendingCell;
            const newBoard = board.map((r, i) =>
                r.map((c, j) => (i === row && j === col ? selectedPlayer : c))
            );
            setBoard(newBoard);
            const gameWinner = checkWinner(newBoard);
            setWinner(gameWinner);
            if (gameWinner?.winner) {
                setShowConfetti(true);
            }
        } else {
            // Wrong answer
            alert('Wrong answer! Turn passes to the other player.');
        }
        setPendingCell(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setCurrentQuestion(null);
        setSelectedPlayer(null);
        setPendingCell(null);
    };

    const resetGame = () => {
        setBoard([
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ]);
        setWinner(null);
        setShowModal(false);
        setCurrentQuestion(null);
        setPendingCell(null);
        setSelectedPlayer(null);
        setShowConfetti(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4 overflow-hidden">
            {showConfetti && <Confetti style={{position:'fixed', pointerEvents:'none', width:'100%', height:'100%'}} run />}
            <h1 className="text-4xl font-bold mb-8 text-white">Tic Tac Toe</h1>
            {winner?.winner && (
                <div className="mb-4">
                    <p className="text-2xl font-semibold text-center text-white">
                        {winner.winner === 'Draw' ? 'It\'s a Draw!' : `Player ${winner.winner} Wins!`}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-3 gap-4 mb-8 mx-auto relative">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <button
                            key={`${rowIndex}-${colIndex}`}
                            className={`cursor-pointer w-40 h-32 bg-white border-2 border-gray-300 rounded-lg text-6xl font-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center ${cell === 'X' ? 'text-red-500' : cell === 'O' ? 'text-blue-500' : ''
                                }`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={!!cell || !!winner?.winner}

                        >
                            {cell}
                        </button>
                    ))
                )}
                {winner && winner.type && (() => {
                    const buttonWidth = 160;
                    const buttonHeight = 128;
                    const gap = 16;
                    const gridWidth = 3 * buttonWidth + 2 * gap;
                    const gridHeight = 3 * buttonHeight + 2 * gap;
                    let lineStyle: React.CSSProperties = {};
                    if (winner.type === 'row' && winner.index !== null) {
                        const top = winner.index * (buttonHeight + gap) + buttonHeight / 2 - 2;
                        lineStyle = { position: 'absolute', top: `${top}px`, left: '0', width: `${gridWidth}px`, height: '4px', background: 'orange', zIndex: 10 };
                    } else if (winner.type === 'col' && winner.index !== null) {
                        const left = winner.index * (buttonWidth + gap) + buttonWidth / 2 - 2;
                        lineStyle = { position: 'absolute', top: '0', left: `${left}px`, width: '4px', height: `${gridHeight}px`, background: 'orange', zIndex: 10 };
                    } else if (winner.type === 'diag1') {
                        const angle = Math.atan2(gridHeight, gridWidth) * 180 / Math.PI;
                        const length = Math.sqrt(gridWidth ** 2 + gridHeight ** 2);
                        lineStyle = { position: 'absolute', top: `0`, left: `0`, width: `${length}px`, height: '4px', background: 'orange', transform: `rotate(${angle}deg)`, transformOrigin: '0 0', zIndex: 10 };
                    } else if (winner.type === 'diag2') {
                        const angle = Math.atan2(gridHeight, -gridWidth) * 180 / Math.PI;
                        const length = Math.sqrt(gridWidth ** 2 + gridHeight ** 2);
                        lineStyle = { position: 'absolute', top: `0`, left: `${buttonWidth * 3 + gap * 2}px`, width: `${length}px`, height: '4px', background: 'orange', transform: `rotate(${angle}deg)`, transformOrigin: '0 0', zIndex: 10 };
                    }
                    return <div style={lineStyle}></div>;
                })()}
            </div>
            <div className="flex space-x-4">
                <button
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={resetGame}
                >
                    Reset Game
                </button>
            </div>


            <button
                className="fixed top-4 right-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => {
                    localStorage.removeItem('usedCommon');
                    localStorage.removeItem('usedHard');
                    setUsedCommon([]);
                    setUsedHard([]);
                }}
            >
                Reset Saved Questions
            </button>

            {showModal && currentQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
                        <button
                            className="absolute top-0 right-3 text-black hover:text-gray-700 text-2xl font-bold"
                            onClick={closeModal}
                        >
                           x
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center text-black">Select Player and Answer</h2>
                        <div className="mb-4">
                            <div className="flex justify-center space-x-4">
                                <label className="flex items-center text-black">
                                    <input
                                        type="radio"
                                        name="player"
                                        value="X"
                                        checked={selectedPlayer === 'X'}
                                        onChange={() => setSelectedPlayer('X')}
                                        className="mr-2"
                                    />
                                    Player X
                                </label>
                                <label className="flex items-center text-black">
                                    <input
                                        type="radio"
                                        name="player"
                                        value="O"
                                        checked={selectedPlayer === 'O'}
                                        onChange={() => setSelectedPlayer('O')}
                                        className="mr-2"
                                    />
                                    Player O
                                </label>
                            </div>
                        </div>
                        <p className="text-lg mb-6 text-center text-black">{currentQuestion.statement}</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                className="cursor-pointer px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                onClick={() => handleAnswer(true)}
                                disabled={!selectedPlayer}
                            >
                                True
                            </button>
                            <button
                                className="cursor-pointer  px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                onClick={() => handleAnswer(false)}
                                disabled={!selectedPlayer}
                            >
                                False
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default TicTacToe;