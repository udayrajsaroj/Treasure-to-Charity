import React from 'react';
import './GameBackground.css';

const GameBackground = () => {
    const items = ['🎁', '👕', '📦', '🍎', '🧸', '💖'];
    
    return (
        <div className="game-container">
            <div className="grid-floor"></div>

            {[...Array(12)].map((_, i) => (
                <div 
                    key={i} 
                    className="game-item"
                    style={{
                        left: `${Math.random() * 90}%`,
                        animationDelay: `${Math.random() * 8}s`,
                        animationDuration: `${Math.random() * 4 + 4}s`
                    }}
                >
                    {items[i % items.length]}
                </div>
            ))}

            {[...Array(5)].map((_, i) => (
                <div 
                    key={`l-${i}`}
                    className="circuit-line"
                    style={{
                        top: `${20 * i}%`,
                        animationDelay: `${i * 1.5}s`
                    }}
                ></div>
            ))}
        </div>
    );
};

export default GameBackground;