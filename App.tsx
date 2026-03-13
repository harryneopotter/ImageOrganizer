
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  LayoutGrid, 
  Settings,
  Image as ImageIcon,
  Zap,
  Trash2,
  Filter,
  PieChart
} from 'lucide-react';
import { AnalysisResult, ProcessingMode } from './types';
import { analyzeImage } from './services/geminiService';
import ImageCard from './components/ImageCard';
import StatsDashboard from './components/StatsDashboard';

const BATCH_SIZE = 3; // Processing concurrency

const App: React.FC = () => {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const processingQueueRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    // Fix: Explicitly type the map callback parameters as File to avoid 'unknown' type errors (Error lines 42, 43)
    const newEntries: AnalysisResult[] = imageFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      url: URL.createObjectURL(file),
      category: '',
      description: '',
      tags: [],
      confidence: 0,
      timestamp: Date.now(),
      status: 'pending'
    }));

    setResults(prev => [...prev, ...newEntries]);
    // Store actual file blobs for processing
    (window as any)._fileCache = { ...(window as any)._fileCache, ...newEntries.reduce((acc, entry, i) => {
      acc[entry.id] = imageFiles[i];
      return acc;
    }, {} as any) };
  };

  const fileToToDataURL = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, data] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        resolve({ base64: data, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processNextBatch = useCallback(async () => {
    if (!isProcessing) return;

    const pending = results.filter(r => r.status === 'pending').map(r => r.id);
    if (pending.length === 0) {
      setIsProcessing(false);
      return;
    }

    const batch = pending.slice(0, BATCH_SIZE);
    
    // Mark as processing
    setResults(prev => prev.map(r => batch.includes(r.id) ? { ...r, status: 'processing' } : r));

    const promises = batch.map(async (id) => {
      const file = (window as any)._fileCache[id];
      if (!file) return;

      try {
        const { base64, mimeType } = await fileToToDataURL(file);
        const analysis = await analyzeImage(base64, mimeType, categories);
        
        setResults(prev => prev.map(r => r.id === id ? {
          ...r,
          ...analysis,
          status: 'completed'
        } : r));
      } catch (error) {
        setResults(prev => prev.map(r => r.id === id ? {
          ...r,
          status: 'error',
          error: String(error)
        } : r));
      }
    });

    await Promise.all(promises);
    // Continue processing
    setTimeout(processNextBatch, 500);
  }, [isProcessing, results, categories]);

  useEffect(() => {
    if (isProcessing) {
      processNextBatch();
    }
  }, [isProcessing, processNextBatch]);

  const toggleProcessing = () => setIsProcessing(!isProcessing);

  const clearAll = () => {
    results.forEach(r => URL.revokeObjectURL(r.url));
    setResults([]);
    (window as any)._fileCache = {};
    setIsProcessing(false);
  };

  const filteredResults = results.filter(r => {
    const matchesFilter = r.fileName.toLowerCase().includes(filterText.toLowerCase()) || 
                         r.description.toLowerCase().includes(filterText.toLowerCase()) ||
                         r.tags.some(t => t.toLowerCase().includes(filterText.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesFilter && matchesCategory;
  });

  const stats = {
    total: results.length,
    processed: results.filter(r => r.status === 'completed').length,
    pending: results.filter(r => r.status === 'pending').length,
    errors: results.filter(r => r.status === 'error').length
  };

  const exportJSON = () => {
    const data = results.map(({ url, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gemini-lens-results.json';
    link.click();
  };

  const exportHTML = () => {
    const completed = results.filter(r => r.status === 'completed');
    
    const categoryCounts = completed.reduce((acc, r) => {
      const cat = r.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(categoryCounts), 1);
    
    const barsHtml = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `
        <div class="bar-container">
          <div class="bar-label">${cat}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(count / maxCount) * 100}%"></div>
          </div>
          <div class="bar-value">${count}</div>
        </div>
      `).join('');

    const tableRowsHtml = completed.map(r => `
      <tr>
        <td><strong>${r.fileName}</strong></td>
        <td><span class="category-badge">${r.category || 'None'}</span></td>
        <td>${r.description}</td>
        <td>${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}</td>
        <td>${(r.confidence * 100).toFixed(0)}%</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gemini Lens Categorization Report</title>
        <style>
          :root { --primary: #3b82f6; --bg: #f8fafc; --surface: #ffffff; --text: #0f172a; --text-muted: #64748b; --border: #e2e8f0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { margin-bottom: 2rem; }
          .header h1 { margin: 0 0 0.5rem 0; font-size: 2rem; letter-spacing: -0.025em; }
          .header p { color: var(--text-muted); margin: 0; }
          .card { background: var(--surface); padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; border: 1px solid var(--border); }
          .card h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; }
          
          /* Bar Chart */
          .bar-container { display: flex; align-items: center; margin-bottom: 1rem; gap: 1rem; }
          .bar-label { width: 200px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .bar-track { flex-grow: 1; background: var(--bg); height: 1.5rem; border-radius: 999px; overflow: hidden; }
          .bar-fill { background: var(--primary); height: 100%; border-radius: 999px; transition: width 0.5s ease-out; }
          .bar-value { width: 50px; text-align: right; font-weight: 600; color: var(--text-muted); }
          
          /* Table */
          .search-box { width: 100%; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border); margin-bottom: 1rem; font-size: 1rem; box-sizing: border-box; }
          .table-container { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th, td { padding: 1rem; border-bottom: 1px solid var(--border); }
          th { background: var(--bg); font-weight: 600; color: var(--text-muted); white-space: nowrap; }
          tr:hover td { background: #f8fafc; }
          .category-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 500; }
          .tag { display: inline-block; background: var(--bg); color: var(--text-muted); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; margin: 0.125rem; border: 1px solid var(--border); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Gemini Lens Report</h1>
            <p>Generated on ${new Date().toLocaleString()} &bull; ${completed.length} images categorized</p>
          </div>
          
          <div class="card">
            <h2>Category Distribution</h2>
            ${barsHtml || '<p>No categories found.</p>'}
          </div>
          
          <div class="card">
            <h2>Image Details</h2>
            <input type="text" id="searchInput" class="search-box" onkeyup="filterTable()" placeholder="Search files, tags, categories...">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Tags</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml || '<tr><td colspan="5" style="text-align: center;">No data available.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <script>
          function filterTable() {
            const input = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const text = row.innerText.toLowerCase();
              row.style.display = text.includes(input) ? '' : 'none';
            });
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gemini-lens-visual-report.html';
    link.click();
  };

  const allCategories = ['All', ...Array.from(new Set(results.map(r => r.category).filter(Boolean)))];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Gemini Lens
            </h1>
          </div>
          <p className="text-slate-400 max-w-lg">
            High-speed local image analysis. Organize thousands of photos into smart categories with Google's most efficient vision model.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Add Images</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Browse Folder</span>
            <input 
              type="file" 
              multiple 
              {...{ webkitdirectory: "true", directory: "true" } as any}
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          
          <button 
            onClick={toggleProcessing}
            disabled={results.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              isProcessing 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isProcessing ? 'Pause Task' : 'Start Analysis'}
          </button>
        </div>
      </header>

      {/* Control Bar & Progress */}
      <div className="sticky top-4 z-50 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-400">TOTAL: {stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-mono text-emerald-400">DONE: {stats.processed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-blue-400">PENDING: {stats.pending}</span>
          </div>
          {stats.errors > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-mono text-red-400">ERRORS: {stats.errors}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={exportJSON}
            disabled={results.length === 0}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Export to JSON"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={exportHTML}
            disabled={results.length === 0}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Export Visual HTML Report"
          >
            <PieChart className="w-5 h-5" />
          </button>
          <button 
            onClick={clearAll}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Clear Results"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${stats.total ? (stats.processed / stats.total) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              <input 
                type="text"
                placeholder="Search images, tags..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                <Settings className="w-4 h-4" /> Custom Taxonomy
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="New category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none"
                />
                <button 
                  onClick={() => {
                    if (newCategory && !categories.includes(newCategory)) {
                      setCategories([...categories, newCategory]);
                      setNewCategory('');
                    }
                  }}
                  className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-bold"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span key={i} className="group flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">
                    {cat}
                    <button 
                      onClick={() => setCategories(categories.filter(c => c !== cat))}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {categories.length === 0 && (
                  <p className="text-[11px] text-slate-500 italic">No constraints. Gemini will auto-categorize.</p>
                )}
              </div>
            </div>
          </div>
          
          <StatsDashboard results={results} />
        </aside>

        {/* Main Grid Area */}
        <main className="lg:col-span-9 space-y-4">
          {results.length === 0 ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-medium text-slate-200">No images loaded</h4>
                <p className="text-sm text-slate-500 max-w-xs">
                  Drag and drop a folder or select files to start your bulk image categorization project.
                </p>
              </div>
              <div className="flex gap-4">
                <label className="px-6 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 cursor-pointer text-sm transition-all border border-slate-700">
                  Browse Files
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <label className="px-6 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 cursor-pointer text-sm transition-all border border-slate-700">
                  Browse Folder
                  <input type="file" multiple {...{ webkitdirectory: "true", directory: "true" } as any} className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredResults.map((item) => (
                <ImageCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {filteredResults.length === 0 && results.length > 0 && (
            <div className="py-20 text-center text-slate-500">
              No results matching your filters.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
