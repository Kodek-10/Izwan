import React, { useState } from 'react';
import { generateTagsAndDescription } from '../services/api';

const SnippetForm = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateTagsAndDescription(code, language);
      setTags(data.tags);
      setDescription(data.description);
    } catch (error) {
      console.error("Erreur lors de la génération IA", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium">Langage</label>
        <input 
          type="text" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 border rounded bg-background"
          suppressHydrationWarning
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Code</label>
        <textarea 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded font-mono text-sm bg-background"
          placeholder="Collez votre code ici..."
          suppressHydrationWarning
        />
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        suppressHydrationWarning
      >
        {loading ? "Génération..." : "✨ Générer automatiquement"}
      </button>

      {description && (
        <div className="mt-4 p-3 bg-muted rounded">
          <p className="text-sm font-bold">Description générée :</p>
          <p className="text-sm">{description}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-bold">Tags :</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnippetForm;
