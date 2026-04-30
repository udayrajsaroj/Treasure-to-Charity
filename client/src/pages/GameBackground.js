import React, { useMemo } from 'react';
import './GameBackground.css';

const items = ['🎁', '👕', '📦', '🍎', '🧸', '💖'];

const GameBackground = () => {
    const gameItems = useMemo(() => 
        [...Array(8)].map((_, i) => ({  // 12 → 8
            id: i,
            left: `${(i * 11) % 90}%`,  // Math.random() hataya
            delay: `${(i * 1.1) % 8}s`,
            duration: `${6 + (i % 4)}s`
        })), []  // sirf ek baar calculate hoga
    );

    return (
        <div className="game-container">
            <div className="grid-floor"></div>
            {gameItems.map((item) => (
                <div
                    key={item.id}
                    className="game-item"
                    style={{
                        left: item.left,
                        animationDelay: item.delay,
                        animationDuration: item.duration
                    }}
                >
                    {items[item.id % items.length]}
                </div>
            ))}
        </div>
    );
};

export default GameBackground;