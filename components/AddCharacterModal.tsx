import React, { useState, useEffect } from 'react';
import { Character } from '../types';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterData: any) => void; // Using any loosely for Omit<Character...>
  initialData?: Character;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    catchphrase: '',
    age: 25,
    birthday: '',
    height: 170,
    mbti: '',
    traits: '',
    likes: '',
    dislikes: '',
    role: '', // Can be auto-assigned
    isEmployed: true,
  });

  // Load data when opening for edit
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          imageUrl: initialData.imageUrl || '',
          catchphrase: initialData.catchphrase || '',
          age: initialData.age,
          birthday: initialData.birthday,
          height: initialData.height,
          mbti: initialData.mbti,
          traits: initialData.traits.join(', '),
          likes: initialData.likes.join(', '),
          dislikes: initialData.dislikes.join(', '),
          role: initialData.role,
          isEmployed: initialData.isEmployed,
        });
      } else {
        // Reset for new character
        setFormData({
          name: '',
          imageUrl: '',
          catchphrase: '',
          age: 27,
          birthday: '01-01',
          height: 170,
          mbti: 'ISTJ',
          traits: '',
          likes: '',
          dislikes: '',
          role: '',
          isEmployed: true,
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const determineRoleByAge = (age: number) => {
    // Logic to determine a random role based on age range
    const rand = Math.random();
    if (age < 27) {
      if (rand > 0.8) return '아르바이트';
      return '인턴';
    } else if (age < 33) {
      if (rand > 0.7) return '대리';
      return '사원';
    } else if (age < 40) {
      if (rand > 0.8) return '팀장';
      return '과장';
    } else if (age < 50) {
      if (rand > 0.8) return '이사';
      return '부장';
    } else {
      if (rand > 0.9) return '사장';
      return '임원';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const finalRole = formData.role || determineRoleByAge(formData.age);

    const saveData = {
      ...formData,
      role: finalRole,
      traits: formData.traits.split(',').map(t => t.trim()).filter(Boolean),
      likes: formData.likes.split(',').map(t => t.trim()).filter(Boolean),
      dislikes: formData.dislikes.split(',').map(t => t.trim()).filter(Boolean),
      status: initialData ? initialData.status : '신규 입사', // Preserve status if editing
    };

    onSave(saveData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a temporary local URL for the file
      // This URL works until the document is unloaded (refresh)
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl: objectUrl }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-lg shadow-2xl my-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {initialData ? '직원 정보 수정' : '신규 입사자 등록'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs text-gray-400 mb-1">이름</label>
               <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs text-gray-400 mb-1">프로필 이미지 (기기 업로드)</label>
               <div className="flex gap-2">
                 <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                 />
                 {formData.imageUrl && (
                   <img src={formData.imageUrl} alt="Preview" className="w-9 h-9 rounded object-cover border border-gray-600" />
                 )}
               </div>
               <p className="text-[10px] text-gray-500 mt-1">* 새로고침 시 이미지는 초기화됩니다.</p>
            </div>
          </div>

          <div>
             <label className="block text-xs text-blue-300 mb-1">한 줄 소개 / 말버릇 (성격 추론용)</label>
             <input
              name="catchphrase"
              value={formData.catchphrase}
              onChange={handleChange}
              placeholder="예: 나 때는 말이야~ / 칼퇴하겠습니다."
              className="w-full bg-gray-700 text-white rounded p-2 border border-blue-900/50 focus:border-blue-500 outline-none placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div>
               <label className="block text-xs text-gray-400 mb-1">나이</label>
               <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"/>
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">MBTI</label>
               <select name="mbti" value={formData.mbti} onChange={handleChange} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none">
                  {['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
               </select>
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">키 (cm)</label>
               <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"/>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs text-gray-400 mb-1">생일 (MM-DD)</label>
               <input type="text" name="birthday" value={formData.birthday} onChange={handleChange} placeholder="01-01" className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"/>
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">
                 직위 <span className="text-gray-500 font-normal">(비워두면 나이 기반 자동)</span>
               </label>
               <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="자동 결정" className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"/>
             </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">성격 (Traits) - 콤마 구분</label>
            <input name="traits" value={formData.traits} onChange={handleChange} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none" placeholder="성실함, 다혈질"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">좋아하는 것 (Likes)</label>
              <textarea name="likes" value={formData.likes} onChange={handleChange} className="w-full h-16 bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none resize-none text-xs" placeholder="콤마로 구분"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">싫어하는 것 (Dislikes)</label>
              <textarea name="dislikes" value={formData.dislikes} onChange={handleChange} className="w-full h-16 bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 outline-none resize-none text-xs" placeholder="콤마로 구분"/>
            </div>
          </div>

          {initialData && (
             <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">재직 상태:</label>
                <button 
                  type="button" 
                  onClick={() => setFormData(p => ({...p, isEmployed: !p.isEmployed}))}
                  className={`px-3 py-1 rounded text-xs font-bold ${formData.isEmployed ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}
                >
                  {formData.isEmployed ? '재직 중' : '해고/퇴사 상태'}
                </button>
             </div>
          )}

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-medium"
            >
              {initialData ? '수정 완료' : '입사 처리'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterModal;