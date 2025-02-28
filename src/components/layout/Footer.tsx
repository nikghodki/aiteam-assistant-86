
import { Terminal } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full py-8 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Terminal size={20} className="text-primary" />
            <span className="font-semibold tracking-tight text-foreground">SRE Assistant</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <nav className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
            </nav>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SRE Assistant. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
