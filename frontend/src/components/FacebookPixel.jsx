import { useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

export default function FacebookPixel() {
    const { facebookPixelId } = useSettings();

    useEffect(() => {
        if (facebookPixelId && !window.fbq) {
            // Inject Facebook Pixel script
            const script = document.createElement('script');
            script.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${facebookPixelId}');
                fbq('track', 'PageView');
            `;
            document.head.appendChild(script);

            // Add noscript fallback
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = 'none';
            img.src = `https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`;
            noscript.appendChild(img);
            document.head.appendChild(noscript);
        }
    }, [facebookPixelId]);

    return null;
}