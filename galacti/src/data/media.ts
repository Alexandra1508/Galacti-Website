// Single source of truth for GALACTI media.
// - Cosmic Blue: the 5 original supplied photographs
// - Eclipse Grey: bespoke studio front portrait + genuine stills extracted from eclipse-grey.mp4
// - Craftsmanship: bespoke macro headlight + forged carbon + centered Lanczos3 detail crops
import bProfile from '../assets/photos/cosmic-blue-profile.jpg';
import bFront from '../assets/photos/cosmic-blue-front.jpg';
import bInterior from '../assets/photos/cosmic-blue-interior.jpg';
import bDoors from '../assets/photos/cosmic-blue-doors.jpg';
import bRear from '../assets/photos/cosmic-blue-rear.jpg';

import gFront from '../assets/photos/eclipse-grey-front.jpg';
import gTrack from '../assets/photos/eclipse-grey-track.jpg';
import gRear from '../assets/photos/eclipse-grey-rear.jpg';
import gFender from '../assets/photos/eclipse-grey-fender.jpg';
import gWheel from '../assets/photos/eclipse-grey-wheel.jpg';
import gExhaust from '../assets/photos/eclipse-grey-exhaust.jpg';
import gMist from '../assets/photos/eclipse-grey-mist.jpg';

import cHeadlight from '../assets/photos/craft-headlight.jpg';
import cWheel from '../assets/photos/craft-wheel.jpg';
import cCockpit from '../assets/photos/craft-cockpit.jpg';
import cCarbon from '../assets/photos/craft-carbon.jpg';

export const blue = {
  profile: bProfile,
  front: bFront,
  interior: bInterior,
  doors: bDoors,
  rear: bRear,
};

export const grey = {
  front: gFront,
  profile: gFender,
  track: gTrack,
  rear: gRear,
  fender: gFender,
  wheel: gWheel,
  exhaust: gExhaust,
  mist: gMist,
};

export const craft = {
  headlight: cHeadlight,
  wheel: cWheel,
  cockpit: cCockpit,
  carbon: cCarbon,
};

export const video = {
  blue: '/media/video/cosmic-blue.mp4',
  grey: '/media/video/eclipse-grey.mp4',
};

export const alt = {
  profile: 'GALACTI Cosmic Blue — perfil lateral completo diante de um campo estelar cósmico',
  front: 'GALACTI Cosmic Blue — vista frontal simétrica com conjunto óptico iluminado',
  interior: 'GALACTI Cosmic Blue — cabine escura pespontada com volante em carbono e painel de instrumentos',
  doors: 'GALACTI Cosmic Blue — ângulo em três quartos com portas diédricas erguidas sob a Via Láctea',
  rear: 'GALACTI Cosmic Blue — traseira em três quartos com lanternas quádruplas e difusor esculpido',
  greyFront: 'GALACTI Eclipse Grey — hipercarro em grafite acetinado líquido sob um anel luminoso de eclipse',
  greyTrack: 'GALACTI Eclipse Grey — aproximação noturna em pista úmida',
  greyRear: 'GALACTI Eclipse Grey — estudo traseiro em movimento com rastros luminosos',
  greyFender: 'GALACTI Eclipse Grey — para-lama dianteiro esculpido, retrovisor e saia lateral aerodinâmica',
  greyWheel: 'GALACTI Eclipse Grey — roda forjada multirraios e pinça de freio cerâmico',
  greyExhaust: 'GALACTI Eclipse Grey — escapamento duplo central e difusor traseiro em carbono esculpido',
  greyMist: 'GALACTI Eclipse Grey — presença frontal emergindo em meio à névoa noturna',
  craftHeadlight: 'Vista macro do farol de LED em óptica cristalina embutido em carbono forjado com acabamento champagne',
  craftWheel: 'Vista macro da roda forjada de cinco raios, disco carbono-cerâmico e pinça',
  craftCockpit: 'Vista macro do volante com acabamento em carbono, mostradores e comandos do console',
  craftCarbon: 'Textura de superfície em trama de carbono forjado',
};
