/**
 * Ad Blocker - Blocks ads, trackers, and malicious scripts
 */

// Common ad domains and tracking domains
const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'facebook.com/tr',
  'facebook.net',
  'ads.yahoo.com',
  'adnxs.com',
  'advertising.com',
  'adsystem.com',
  'adtech.de',
  'adform.net',
  'criteo.com',
  'outbrain.com',
  'taboola.com',
  'scorecardresearch.com',
  'quantserve.com',
  'moatads.com',
  'adroll.com',
  'rubiconproject.com',
];

// Common tracker domains
const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.com/tr',
  'connect.facebook.net',
  'hotjar.com',
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
  'fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'heap.io',
];

// Malware and phishing domains (example list)
const MALWARE_DOMAINS = [
  'malware-site.com',
  'phishing-site.com',
  'virus-download.com',
];

// Ad selectors (CSS selectors for common ad elements)
const AD_SELECTORS = [
  '[class*="ad-"]',
  '[id*="ad-"]',
  '[class*="advertisement"]',
  '[id*="advertisement"]',
  '[class*="banner"]',
  '[id*="banner"]',
  '.ad',
  '.ads',
  '.adsbygoogle',
  '#ad',
  '#ads',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="ads"]',
];

export interface BlockedItem {
  url: string;
  type: 'ad' | 'tracker' | 'malware';
  timestamp: number;
}

export class AdBlocker {
  private blockedItems: BlockedItem[] = [];
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Block network requests
    this.interceptFetch();
    this.interceptXHR();
    
    // Remove ad elements from DOM
    this.removeAdElements();
    
    // Watch for dynamically added ads
    this.watchForNewAds();
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = (...args: any[]) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      if (this.shouldBlock(url)) {
        const type = this.getBlockType(url);
        this.logBlocked(url, type);
        return Promise.reject(new Error(`Blocked by ad blocker: ${url}`));
      }
      
      return originalFetch.apply(window, args as [RequestInfo | URL, RequestInit?]);
    };
  }

  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      if (self.shouldBlock(urlString)) {
        const type = self.getBlockType(urlString);
        self.logBlocked(urlString, type);
        throw new Error(`Blocked by ad blocker: ${urlString}`);
      }
      
      return originalOpen.apply(this, [method, url, ...rest] as any);
    };
  }

  private removeAdElements() {
    if (typeof document === 'undefined') return;

    AD_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
          this.logBlocked(selector, 'ad');
        });
      } catch (e) {
        // Invalid selector, skip
      }
    });
  }

  private watchForNewAds() {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as Element;
            
            // Check if the element matches ad selectors
            AD_SELECTORS.forEach(selector => {
              try {
                if (element.matches(selector)) {
                  element.remove();
                  this.logBlocked(selector, 'ad');
                }
                
                // Check children
                const children = element.querySelectorAll(selector);
                children.forEach(child => {
                  child.remove();
                  this.logBlocked(selector, 'ad');
                });
              } catch (e) {
                // Invalid selector, skip
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private shouldBlock(url: string): boolean {
    if (!this.enabled) return false;
    
    const lowerUrl = url.toLowerCase();
    
    // Check against all block lists
    return [...AD_DOMAINS, ...TRACKER_DOMAINS, ...MALWARE_DOMAINS].some(domain => 
      lowerUrl.includes(domain.toLowerCase())
    );
  }

  private getBlockType(url: string): 'ad' | 'tracker' | 'malware' {
    const lowerUrl = url.toLowerCase();
    
    if (MALWARE_DOMAINS.some(domain => lowerUrl.includes(domain.toLowerCase()))) {
      return 'malware';
    }
    
    if (TRACKER_DOMAINS.some(domain => lowerUrl.includes(domain.toLowerCase()))) {
      return 'tracker';
    }
    
    return 'ad';
  }

  private logBlocked(url: string, type: 'ad' | 'tracker' | 'malware') {
    this.blockedItems.push({
      url,
      type,
      timestamp: Date.now(),
    });
    
    console.log(`[AdBlocker] Blocked ${type}: ${url}`);
  }

  public getBlockedItems(): BlockedItem[] {
    return [...this.blockedItems];
  }

  public getBlockedCount(): { ads: number; trackers: number; malware: number; total: number } {
    const ads = this.blockedItems.filter(item => item.type === 'ad').length;
    const trackers = this.blockedItems.filter(item => item.type === 'tracker').length;
    const malware = this.blockedItems.filter(item => item.type === 'malware').length;
    
    return {
      ads,
      trackers,
      malware,
      total: this.blockedItems.length,
    };
  }

  public clearLog() {
    this.blockedItems = [];
  }

  public enable() {
    this.enabled = true;
    this.removeAdElements();
  }

  public disable() {
    this.enabled = false;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
let adBlockerInstance: AdBlocker | null = null;

export function getAdBlocker(): AdBlocker {
  if (!adBlockerInstance) {
    adBlockerInstance = new AdBlocker();
  }
  return adBlockerInstance;
}

