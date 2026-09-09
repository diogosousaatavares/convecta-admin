/**
 * Fundo da página de entrada: fitas escuras a correr pelo lado direito e uma
 * linha dourada por cima. A linha é a única coisa que se mexe — um brilho
 * curto que percorre o traço. Tudo o resto é estático de propósito.
 */
export default function FundoLogin() {
  return (
    <>
      <style>{`
        @keyframes cvLinhaCorre {
          from { stroke-dashoffset: 2600 }
          to   { stroke-dashoffset: -600 }
        }
        .cv-linha-corre { animation: cvLinhaCorre 9s linear infinite }
        @media (prefers-reduced-motion: reduce) { .cv-linha-corre { animation: none; opacity:.5 } }
      `}</style>

      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
        <defs>
          <linearGradient id="cvFitaA" x1="1" y1="0" x2="0.1" y2="1">
            <stop offset="0%"   stopColor="#333330"/>
            <stop offset="45%"  stopColor="#171613"/>
            <stop offset="100%" stopColor="#0A0807"/>
          </linearGradient>
          <linearGradient id="cvFitaB" x1="1" y1="0.1" x2="0.2" y2="1">
            <stop offset="0%"   stopColor="#23221F"/>
            <stop offset="60%"  stopColor="#100F0D"/>
            <stop offset="100%" stopColor="#0A0807"/>
          </linearGradient>
          <linearGradient id="cvFitaC" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#43413B"/>
            <stop offset="70%"  stopColor="#14130F"/>
            <stop offset="100%" stopColor="#0A0807"/>
          </linearGradient>
          <linearGradient id="cvOuro" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%"   stopColor="#C9A227" stopOpacity="0"/>
            <stop offset="28%"  stopColor="#F5D66B" stopOpacity=".95"/>
            <stop offset="62%"  stopColor="#C9A227" stopOpacity=".55"/>
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0"/>
          </linearGradient>
          <filter id="cvBrilho" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9"/>
          </filter>
        </defs>

        {/* Fitas — do canto superior direito a descer em curva até ao fundo. */}
        <path fill="url(#cvFitaA)" opacity=".92"
          d="M1600,-40 C1240,110 1090,400 1230,650 C1330,830 1470,905 1600,950 Z"/>
        <path fill="url(#cvFitaB)" opacity=".95"
          d="M1600,60 C1320,210 1195,470 1345,730 C1420,860 1520,915 1600,945 Z"/>
        <path fill="url(#cvFitaC)" opacity=".55"
          d="M1600,150 C1395,285 1300,505 1430,760 C1480,860 1545,905 1600,930 Z"/>
        <path fill="#0A0807" opacity=".85"
          d="M1600,330 C1480,420 1425,570 1505,745 C1540,825 1575,875 1600,905 Z"/>

        {/* A linha dourada: traço fixo, brilho a correr por cima. */}
        <g>
          <path d="M1600,120 C1268,268 1152,530 1318,790 C1400,905 1510,962 1600,1000"
            fill="none" stroke="url(#cvOuro)" strokeWidth="14" opacity=".18" filter="url(#cvBrilho)"/>
          <path d="M1600,120 C1268,268 1152,530 1318,790 C1400,905 1510,962 1600,1000"
            fill="none" stroke="url(#cvOuro)" strokeWidth="2.2"/>
          <path className="cv-linha-corre"
            d="M1600,120 C1268,268 1152,530 1318,790 C1400,905 1510,962 1600,1000"
            fill="none" stroke="#F5D66B" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="210 2400" opacity=".95"/>
        </g>

        {/* Segunda linha, mais discreta, a acompanhar. */}
        <path d="M1600,250 C1390,360 1315,545 1432,762 C1485,858 1548,910 1600,940"
          fill="none" stroke="url(#cvOuro)" strokeWidth="1.1" opacity=".45"/>
      </svg>

      <div aria-hidden style={{ position:'absolute', top:'-18%', right:'-8%', width:720, height:720,
        borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(201,162,39,.10) 0%, rgba(201,162,39,0) 65%)' }}/>
    </>
  )
}
