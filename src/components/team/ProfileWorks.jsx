import { useRef } from 'react';
import { assetUrl } from '../../lib/assetUrl.js';
import Img from '../Img.jsx';
import StripArrows from '../StripArrows.jsx';

const ROW_ID = 'profile-works';

/** A barber's works as a swipe row, with arrows for a mouse (StripArrows). `heading` sits on the arrows' line. */
export default function ProfileWorks({ works, heading }) {
  const rowRef = useRef(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {heading}
        <StripArrows rowRef={rowRef} rowId={ROW_ID} />
      </div>
      <ul
        ref={rowRef}
        id={ROW_ID}
        className="-mx-5 mt-4 flex snap-x scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {works.map((work) => (
          <li key={work.src} className="w-36 shrink-0 snap-start overflow-hidden rounded bg-surface sm:w-44">
            <Img src={assetUrl(work.src)} alt={work.alt} width={work.width} height={work.height} className="aspect-[4/5] h-auto w-full object-cover" />
          </li>
        ))}
      </ul>
    </>
  );
}
