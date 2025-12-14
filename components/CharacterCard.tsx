import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  allCharacters: Character[];
  onEdit: (char: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, allCharacters, onEdit }) => {
  // Find top relationship (either highest positive or lowest negative)
  const relEntries = Object.entries(character.relationships);
  const bestieId = [...relEntries].sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0];
  const enemyId = [...relEntries].sort((a, b) => (a[1] as number) - (b[1] as number))[0]?.[0];

  const getName = (id: string) => allCharacters.find(c => c.id === id)?.name || 'Unknown';

  const defaultImage = `https://api.dicebear.com/9.x/avataaars/svg?seed=${character.name}`;

  return (
    <div className={`
      relative border rounded-lg p-3 flex flex-col gap-2 shadow-lg transition-all
      ${character.isEmployed 
        ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
        : 'bg-gray-900 border-red-900/50 opacity-80 grayscale-[0.5]'
      }
    `}>
      {!character.isEmployed && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded rotate-12 z-10 shadow-lg">
          해고됨
        </div>
      )}

      <div className="flex gap-3">
        {/* Profile Image (1:1) */}
        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-700 border border-gray-600 relative group cursor-pointer" onClick={() => onEdit(character)}>
          <img 
            src={character.imageUrl || defaultImage} 
            alt={character.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-xs text-white">수정</span>
          </div>
        </div>

        {/* Info Header */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white truncate">{character.name}</h3>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(character); }}
              className="text-xs text-gray-500 hover:text-blue-400"
            >
              ✏️
            </button>
          </div>
          <p className={`text-sm font-medium truncate ${character.isEmployed ? 'text-blue-400' : 'text-red-400 line-through'}`}>
            {character.role}
          </p>
          <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-400">
            <span>{character.age}세</span>
            <span className="text-gray-600">|</span>
            <span>{character.mbti}</span>
            <span className="text-gray-600">|</span>
            <span>{character.status}</span>
          </div>
        </div>
      </div>

      {/* Catchphrase Display */}
      {character.catchphrase && (
        <div className="text-xs italic text-gray-400 border-l-2 border-gray-600 pl-2 py-0.5">
          "{character.catchphrase}"
        </div>
      )}

      {/* Traits & Likes */}
      <div className="flex flex-wrap gap-1 mt-1">
        {character.traits.slice(0, 3).map((trait, idx) => (
          <span key={idx} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
            #{trait}
          </span>
        ))}
      </div>

      {/* Relationship Mini Stats */}
      <div className="text-xs text-gray-400 mt-1 space-y-0.5 bg-gray-900/30 p-2 rounded">
        {bestieId && character.relationships[bestieId] > 0 && (
          <div className="flex justify-between">
            <span>💖 {getName(bestieId)}</span>
            <span className="text-green-400">+{character.relationships[bestieId]}</span>
          </div>
        )}
        {enemyId && character.relationships[enemyId] < 0 && (
          <div className="flex justify-between">
            <span>💔 {getName(enemyId)}</span>
            <span className="text-red-400">{character.relationships[enemyId]}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard;