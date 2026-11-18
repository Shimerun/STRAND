import Img from '../Img.jsx';
import { barberPhoto, initials } from './photo.js';

export default function BarberPhoto({ barber, width = 800, height = 1000, fallbackClassName = '', ...props }) {
  return (
    <Img
      src={barberPhoto(barber.slug)}
      width={width}
      height={height}
      {...props}
      fallback={
        <span aria-hidden="true" className={`flex w-full items-center justify-center font-extrabold text-concrete ${fallbackClassName}`}>
          {initials(barber.name)}
        </span>
      }
    />
  );
}
