import React, { useState } from 'react';
import { Save, Trash2, Plus, X, Link as LinkIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { FormSchema, FormField, FormFieldType } from '../store';

interface EventEditorProps {
  event: FormSchema;
  onUpdate: (id: string, field: string, value: any) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}

const FILE_TYPES = ['jpeg', 'jpg', 'pdf', 'png', 'raw', 'cr2', 'mp4', 'mp3'];

export const EventEditor: React.FC<EventEditorProps> = ({ event, onUpdate, onSave, onDelete }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleAddField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'text',
      label: 'New Question',
      required: true,
    };
    onUpdate(event.id, 'fields', [...(event.fields || []), newField]);
  };

  const handleUpdateField = (fieldId: string, key: keyof FormField, value: any) => {
    const fields = event.fields || [];
    const updatedFields = fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f);
    onUpdate(event.id, 'fields', updatedFields);
  };

  const handleRemoveField = (fieldId: string) => {
    const fields = event.fields || [];
    onUpdate(event.id, 'fields', fields.filter(f => f.id !== fieldId));
  };

  const handleToggleFileType = (fieldId: string, fileType: string) => {
    const fields = event.fields || [];
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const currentTypes = field.allowedFileTypes || [];
    const newTypes = currentTypes.includes(fileType)
      ? currentTypes.filter(t => t !== fileType)
      : [...currentTypes, fileType];
    
    handleUpdateField(fieldId, 'allowedFileTypes', newTypes);
  };

  return (
    <div className={`border border-[#e5e7eb] rounded-lg bg-[#f9fafb] overflow-hidden transition-all duration-300 ${isCollapsed ? 'hover:border-[#d1d5db]' : ''}`}>
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="text-[#6b7280]">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 m-0">
              {event.name || 'Unnamed Event'}
            </h4>
            {isCollapsed && (
              <p className="text-xs text-gray-500 mt-1 m-0">
                {event.date ? event.date : 'No date set'}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               const url = `${window.location.origin}/${event.category}/${encodeURIComponent(event.name)}`;
               navigator.clipboard.writeText(url);
               alert('Shareable link copied to clipboard!');
             }}
             className="text-gray-400 hover:text-blue-500 p-2 transition-colors"
             title="Copy Sharable Link"
           >
             <LinkIcon size={16} />
           </button>
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onDelete(event.id);
             }}
             className="text-gray-400 hover:text-red-500 p-2 transition-colors"
             title="Delete Event"
           >
             <Trash2 size={16} />
           </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-4 border-t border-[#e5e7eb] space-y-4 bg-white">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-[#6b7280] block mb-1">Event Name</label>
              <input 
                type="text"
                value={event.name}
                onChange={(e) => onUpdate(event.id, 'name', e.target.value)}
                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#6b7280] block mb-1">Date / Time (Display)</label>
                <input 
                  type="text"
                  value={event.date}
                  onChange={(e) => onUpdate(event.id, 'date', e.target.value)}
                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#6b7280] block mb-1">Event End Date (Deletes photos 3 weeks after)</label>
                <input 
                  type="date"
                  value={event.autoCleanupDate || ''}
                  onChange={(e) => onUpdate(event.id, 'autoCleanupDate', e.target.value)}
                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-xs font-mono text-[#6b7280] block mb-1">Form Status</label>
                <select
                  value={event.status || 'draft'}
                  onChange={(e) => onUpdate(event.id, 'status', e.target.value)}
                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                >
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-red-600 block mb-1">Actual Event Date (for CRM/Certificates)</label>
              <input 
                type="date"
                value={event.eventDate || ''}
                onChange={(e) => onUpdate(event.id, 'eventDate', e.target.value)}
                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
              />
              <p className="text-[10px] text-[#6b7280] mt-1">If set, approved apps trigger attendance checks a day after this date.</p>
            </div>

            <div>
              <label className="text-xs font-mono text-[#6b7280] block mb-1">Allowed Emails (comma separated)</label>
              <input 
                type="text"
                value={(event.allowedEmails || []).join(', ')}
                onChange={(e) => onUpdate(event.id, 'allowedEmails', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="admin@example.com"
                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#6b7280] block mb-1">Description</label>
              <textarea 
                value={event.description}
                onChange={(e) => onUpdate(event.id, 'description', e.target.value)}
                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[80px]"
              />
            </div>
            
            {/* Dynamic Fields Section */}
            <div className="pt-4 border-t border-[#e5e7eb]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono text-[#6b7280] block">Form Questions</label>
                  <button 
                    onClick={handleAddField}
                    className="flex items-center gap-1 text-xs bg-[#ffffff] border border-[#e5e7eb] px-2 py-1 rounded hover:bg-[#e5e7eb] transition-colors"
                  >
                    <Plus size={12} /> Add Question
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(event.fields || []).map((field, index) => (
                    <div key={field.id} className="p-3 border border-[#e5e7eb] rounded bg-[#f9fafb]">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                            placeholder="Question Label"
                            className="w-full bg-white border border-[#e5e7eb] rounded p-1.5 text-sm"
                          />
                          <div className="flex gap-2 items-center">
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateField(field.id, 'type', e.target.value as FormFieldType)}
                              className="bg-white border border-[#e5e7eb] rounded p-1.5 text-xs"
                            >
                              <option value="text">Text (Open Answer)</option>
                              <option value="textarea">Textarea (Long Answer)</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="file">File Upload</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="checkboxes">Checkboxes (Multiple)</option>
                            </select>
                            <label className="flex items-center gap-1 text-xs">
                              <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)}
                              />
                              Обязательный вопрос (Required)
                            </label>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveField(field.id)}
                          className="text-red-500 hover:text-red-700 p-1 bg-white rounded border border-[#e5e7eb]"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {(field.type === 'dropdown' || field.type === 'checkboxes') && (
                        <div className="mt-2 pt-2 border-t border-[#e5e7eb]">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#6b7280] block">Options:</span>
                            <button 
                              onClick={() => handleUpdateField(field.id, 'options', [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`])}
                              className="flex items-center gap-1 text-[10px] bg-white border border-[#e5e7eb] px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={10} /> Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...(field.options || [])];
                                    newOpts[optIndex] = e.target.value;
                                    handleUpdateField(field.id, 'options', newOpts);
                                  }}
                                  className="flex-1 bg-white border border-[#e5e7eb] rounded p-1.5 text-sm"
                                />
                                <button 
                                  onClick={() => {
                                    const newOpts = [...(field.options || [])];
                                    newOpts.splice(optIndex, 1);
                                    handleUpdateField(field.id, 'options', newOpts);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {field.type === 'file' && (
                        <div className="mt-2 pt-2 border-t border-[#e5e7eb]">
                          <span className="text-xs text-[#6b7280] block mb-1">Allowed File Types:</span>
                          <div className="flex flex-wrap gap-2">
                            {FILE_TYPES.map(ft => (
                              <label key={ft} className="flex items-center gap-1 text-xs">
                                <input 
                                  type="checkbox"
                                  checked={(field.allowedFileTypes || []).includes(ft)}
                                  onChange={() => handleToggleFileType(field.id, ft)}
                                />
                                .{ft}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => onSave(event.id)}
                className="bg-black text-white px-6 py-2 text-sm rounded hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

