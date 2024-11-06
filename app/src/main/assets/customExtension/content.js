(function() {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('custom.js');
    script.onload = function() {
        this.remove(); // Retirer le script après son injection
    };
    (document.head || document.documentElement).appendChild(script);
})();