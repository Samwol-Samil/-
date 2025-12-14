import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, LogEntry, SaveData } from './types';
import { INITIAL_CHARACTERS, MAX_RELATIONSHIP, MIN_RELATIONSHIP } from './constants';
import { generateDaySimulation } from './services/geminiService';
import CharacterCard from './components/CharacterCard';
import LogViewer from './components/LogViewer';
import RelationshipGraph from './components/RelationshipGraph';
import CharacterModal from './components/AddCharacterModal';

// Simple UUID generator for browser if uuid package is not available in environment
const generateId = () => Math.random().toString(36).substring(2, 9);
const SAVE_KEY = 'OFFICE_SIM_AUTOSAVE_V1';

export default function App() {
  const [day, setDay] = useState(1);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Track if initial load is done
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
  
  const [viewMode, setViewMode] = useState<'logs' | 'graph'>('logs');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Auto-Load on Mount
  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed: SaveData = JSON.parse(savedData);
        // Simple validation
        if (parsed.characters && parsed.logs && parsed.day) {
          setDay(parsed.day);
          setCharacters(parsed.characters);
          setLogs(parsed.logs);
          console.log("Auto-loaded save data");
        }
      } catch (e) {
        console.error("Failed to load auto-save", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Auto-Save on State Change
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initial load (prevents overwriting with defaults)

    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      day,
      characters,
      logs
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [day, characters, logs, isLoaded]);

  // 3. Export Data
  const handleExport = () => {
    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      day,
      characters,
      logs
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office_sim_day_${day}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Import Data
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: SaveData = JSON.parse(text);

        if (!parsed.characters || !Array.isArray(parsed.characters)) throw new Error("Invalid format");

        setDay(parsed.day || 1);
        setCharacters(parsed.characters);
        setLogs(parsed.logs || []);
        
        // Add a system log to indicate success
        setLogs(prev => [...prev, {
          id: generateId(),
          day: parsed.day || 1,
          text: "💾 외부 데이터 파일이 성공적으로 로드되었습니다.",
          type: 'neutral'
        }]);

      } catch (err) {
        alert("파일을 불러오는데 실패했습니다. 올바른 JSON 파일인지 확인해주세요.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleNextDay = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await generateDaySimulation(day, characters);

      // 1. Add Logs
      const newLogs = result.logs.map((log) => ({
        id: generateId(),
        day: day,
        text: log.text,
        type: log.type,
      }));
      setLogs((prev) => [...prev, ...newLogs]);

      // 2. Update Relationships, Status, and Roles
      setCharacters((prevChars) => {
        return prevChars.map((char) => {
          let updatedChar = { ...char, relationships: { ...char.relationships } };

          // Apply relationship updates
          result.relationshipUpdates.forEach((update) => {
            if (update.sourceId === char.id) {
              const currentScore = updatedChar.relationships[update.targetId] || 0;
              const newScore = Math.max(MIN_RELATIONSHIP, Math.min(MAX_RELATIONSHIP, currentScore + update.amount));
              updatedChar.relationships[update.targetId] = newScore;
            }
          });

          // Apply status updates (e.g., Marriage, Breakup)
          const statusUpdate = result.statusUpdates.find((u) => u.characterId === char.id);
          if (statusUpdate) {
            updatedChar.status = statusUpdate.newStatus;
          }

          // Apply role updates (Promotion, Fired, Rehired)
          const roleUpdate = result.roleUpdates.find((u) => u.characterId === char.id);
          if (roleUpdate) {
            updatedChar.role = roleUpdate.newRole;
            updatedChar.isEmployed = roleUpdate.isEmployed;
          }

          return updatedChar;
        });
      });

      setDay((prev) => prev + 1);
    } catch (e) {
      console.error("Error processing day:", e);
      setLogs((prev) => [
        ...prev,
        { id: generateId(), day, text: "AI 서버와의 통신 중 오류가 발생했습니다.", type: 'negative' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [day, characters, isProcessing]);

  // Handle opening modal for Add
  const openAddModal = () => {
    setEditingCharacter(undefined);
    setIsModalOpen(true);
  };

  // Handle opening modal for Edit
  const openEditModal = (char: Character) => {
    setEditingCharacter(char);
    setIsModalOpen(true);
  };

  const handleSaveCharacter = (charData: any) => {
    if (editingCharacter) {
      // Edit Mode
      setCharacters(prev => prev.map(c => 
        c.id === editingCharacter.id 
          ? { ...c, ...charData, id: c.id, relationships: c.relationships } 
          : c
      ));
      setLogs(prev => [...prev, { id: generateId(), day, text: `📝 '${charData.name}'의 인사 정보가 수정되었습니다.`, type: 'neutral' }]);
    } else {
      // Add Mode
      const newId = `c_${generateId()}`;
      const newCharacter: Character = {
        ...charData,
        id: newId,
        relationships: {},
      };
      
      // Initialize relationships
      characters.forEach(c => {
        newCharacter.relationships[c.id] = 0;
      });

      setCharacters(prev => {
        const updatedExisting = prev.map(c => ({
          ...c,
          relationships: { ...c.relationships, [newId]: 0 }
        }));
        return [...updatedExisting, newCharacter];
      });

      setLogs(prev => [
        ...prev,
        { 
          id: generateId(), 
          day, 
          text: `📢 새로운 직원 '${newCharacter.name}'님이 입사했습니다. (${newCharacter.role} / ${newCharacter.age}세)`, 
          type: 'neutral' 
        }
      ]);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-900 text-gray-100 overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />
      
      {/* Sidebar: Characters */}
      <div className="w-full md:w-80 lg:w-96 bg-gray-800/50 border-r border-gray-700 flex flex-col h-1/3 md:h-full">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              비령 상사
            </h1>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              자동 저장됨
            </span>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={handleExport}
              title="데이터 내보내기 (저장)"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button 
              onClick={handleImportClick}
              title="데이터 불러오기"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {characters.map((char) => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              allCharacters={characters} 
              onEdit={openEditModal}
            />
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={openAddModal}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>+</span> 직원 추가
          </button>
        </div>
      </div>

      {/* Main: Logs & Controls */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full relative">
        <div className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden">
           <div className="mb-4 flex justify-between items-end">
             <div>
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">상황실</h2>
               <p className="text-gray-400 text-sm">Day {day} - 회사 내부의 상호작용 및 사건 사고 실시간 기록</p>
             </div>
             <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
               <button 
                onClick={() => setViewMode('logs')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'logs' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               >
                 📜 로그
               </button>
               <button 
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'graph' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               >
                 🕸️ 관계도
               </button>
             </div>
           </div>
           
           {viewMode === 'logs' ? (
             <LogViewer logs={logs} />
           ) : (
             <RelationshipGraph characters={characters} />
           )}
        </div>

        {/* Sticky Control Bar */}
        <div className="p-4 md:p-8 pt-0 z-10">
          <button
            onClick={handleNextDay}
            disabled={isProcessing}
            className={`
              w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all transform active:scale-95
              flex items-center justify-center gap-3
              ${isProcessing 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/50'
              }
            `}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>시뮬레이션 가동 중...</span>
              </>
            ) : (
              <>
                <span>▶ 다음 날 진행</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CharacterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCharacter}
        initialData={editingCharacter}
      />
    </div>
  );
}