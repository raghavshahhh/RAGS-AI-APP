import { motion } from 'framer-motion';
import { X, Globe, ArrowUp, ArrowDown, MousePointer, Type, Camera, Play } from 'lucide-react';
import { RAGSIcon } from './RAGSLogo';
import { useState, useEffect } from 'react';
import { browserService } from '../services/browserService';
import toast from 'react-hot-toast';

interface BrowserControlPanelProps {
  onClose: () => void;
}

export default function BrowserControlPanel({ onClose }: BrowserControlPanelProps) {
  const [browserActive, setBrowserActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [clickTarget, setClickTarget] = useState('');
  const [typeText, setTypeText] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const status = await browserService.getStatus();
    setBrowserActive(status.available);
  };

  const initializeBrowser = async () => {
    setLoading(true);
    const result = await browserService.initialize();
    if (result.success) {
      setBrowserActive(true);
      toast.success('Browser automation started!');
    } else {
      toast.error('Failed to start browser automation');
    }
    setLoading(false);
  };

  const navigate = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    let url = urlInput.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    setLoading(true);
    const result = await browserService.navigate(url);
    if (result.success) {
      toast.success(`Navigated to ${url}`);
    } else {
      toast.error('Navigation failed');
    }
    setLoading(false);
  };

  const scroll = async (direction: 'up' | 'down') => {
    if (!browserActive) {
      toast.error('Browser not active');
      return;
    }

    const result = await browserService.scroll(direction, 500);
    if (result.success) {
      toast.success(`Scrolled ${direction}`);
    } else {
      toast.error('Scroll failed');
    }
  };

  const clickElement = async () => {
    if (!clickTarget.trim()) {
      toast.error('Please enter target element');
      return;
    }

    if (!browserActive) {
      toast.error('Browser not active');
      return;
    }

    const result = await browserService.click(clickTarget);
    if (result.success) {
      toast.success(`Clicked ${clickTarget}`);
      setClickTarget('');
    } else {
      toast.error('Click failed');
    }
  };

  const typeInBrowser = async () => {
    if (!typeText.trim()) {
      toast.error('Please enter text to type');
      return;
    }

    if (!browserActive) {
      toast.error('Browser not active');
      return;
    }

    const result = await browserService.type(typeText);
    if (result.success) {
      toast.success('Text typed successfully');
      setTypeText('');
    } else {
      toast.error('Type failed');
    }
  };

  const captureScreenshot = async () => {
    if (!browserActive) {
      toast.error('Browser not active');
      return;
    }

    setLoading(true);
    const blob = await browserService.screenshot();
    if (blob) {
      const url = URL.createObjectURL(blob);
      setScreenshot(url);
      toast.success('Screenshot captured!');
    } else {
      toast.error('Screenshot failed');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-[700px] max-h-[80vh] rounded-3xl p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <div>
              <h2 className="text-2xl font-bold text-white">Browser Control</h2>
              <p className="text-xs text-muted">Automate browser actions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Status */}
        <div className="glass p-4 rounded-xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${browserActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white">
              Browser: {browserActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {!browserActive && (
            <button
              onClick={initializeBrowser}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Play size={16} />
              Start Browser
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            Navigate
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter URL (e.g., google.com)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && navigate()}
              className="flex-1 bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={navigate}
              disabled={loading || !browserActive}
              className="px-6 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              Go
            </button>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="text-white font-semibold mb-3">Scroll</h3>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('up')}
              disabled={!browserActive}
              className="flex-1 py-3 bg-dark/50 text-white rounded-lg hover:bg-dark/70 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowUp size={16} />
              Scroll Up
            </button>
            <button
              onClick={() => scroll('down')}
              disabled={!browserActive}
              className="flex-1 py-3 bg-dark/50 text-white rounded-lg hover:bg-dark/70 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowDown size={16} />
              Scroll Down
            </button>
          </div>
        </div>

        {/* Click Control */}
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MousePointer size={16} className="text-primary" />
            Click Element
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Element text or selector"
              value={clickTarget}
              onChange={(e) => setClickTarget(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && clickElement()}
              className="flex-1 bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={clickElement}
              disabled={!browserActive}
              className="px-6 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              Click
            </button>
          </div>
        </div>

        {/* Type Control */}
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Type size={16} className="text-primary" />
            Type Text
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Text to type"
              value={typeText}
              onChange={(e) => setTypeText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && typeInBrowser()}
              className="flex-1 bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={typeInBrowser}
              disabled={!browserActive}
              className="px-6 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              Type
            </button>
          </div>
        </div>

        {/* Screenshot */}
        <div className="glass p-4 rounded-xl">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Camera size={16} className="text-primary" />
            Screenshot
          </h3>
          <button
            onClick={captureScreenshot}
            disabled={!browserActive || loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            Capture Screenshot
          </button>
          {screenshot && (
            <div className="mt-4">
              <img src={screenshot} alt="Screenshot" className="w-full rounded-lg border border-primary/20" />
            </div>
          )}
        </div>

        <p className="text-xs text-muted mt-4 text-center">
          Voice commands: "Open google.com", "Scroll down", "Click search button"
        </p>
      </motion.div>
    </motion.div>
  );
}
