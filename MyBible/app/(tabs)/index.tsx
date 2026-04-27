import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadLastPosition, loadFavorites } from '../../services/storageService';
import type { LastPosition, Favorite } from '../../services/storageService';
import Ionicons from '@expo/vector-icons/Ionicons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TOPBAR_HEIGHT = 108;
const CARD_HEIGHT = SCREEN_HEIGHT - TOPBAR_HEIGHT - (StatusBar.currentHeight ?? 44);

const P = {
  parchment: '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink: '#2C1F0E',
  inkLight: '#5C4020',
  inkFaint: '#A08060',
  sepia: '#8B6540',
  rubriq: '#7A2010',
  rubriqLt: '#B04030',
  verdeGris: '#3A5030',
  azur: '#1A3050',
};

const T = {
  fr: {
    verseTag: 'Verset du jour',
    parabolTag: 'Parabole',
    miracleTag: 'Miracle',
    favoriTag: 'Favori',
    lirePassage: 'Lire le passage',
    lireChapter: 'Lire le chapitre',
    lireBible: 'Lire la Bible',
    reprendre: 'Reprendre',
    swipeHint: 'Faites glisser pour parcourir',
    parametres: 'Paramètres',
    meditation: 'Une parole pour méditer maintenant',
  },
  en: {
    verseTag: 'Verse of the day',
    parabolTag: 'Parable',
    miracleTag: 'Miracle',
    favoriTag: 'Favourite',
    lirePassage: 'Read passage',
    lireChapter: 'Read chapter',
    lireBible: 'Read the Bible',
    reprendre: 'Resume',
    swipeHint: 'Swipe to explore',
    parametres: 'Settings',
    meditation: 'A word to meditate on now',
  },
  mg: {
    verseTag: 'Velominteny',
    parabolTag: 'Fanoharana',
    miracleTag: 'Fahagagana',
    favoriTag: 'Ankafizina',
    lirePassage: 'Vakio ny andalana',
    lireChapter: 'Vakio ny toko',
    lireBible: 'Vakio ny Baiboly',
    reprendre: 'Tohizo',
    swipeHint: 'Atosio (swipe) hijerena bebe kokoa',
    parametres: 'Fikirana',
    meditation: 'Teny ho saintsainina ankehitriny',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VERSETS DU JOUR — versets simples et passages multi-versets
// ─────────────────────────────────────────────────────────────────────────────
const VERSE_DU_JOUR = {
  fr: [
    { ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.', book: 43, chapter: 3, verse: 16 },
    { ref: 'Philippiens 4:13', text: 'Je puis tout par celui qui me fortifie.', book: 50, chapter: 4, verse: 13 },
    { ref: 'Psaumes 23:1', text: 'L\'Éternel est mon berger : je ne manquerai de rien.', book: 19, chapter: 23, verse: 1 },
    { ref: 'Romains 8:28', text: 'Toutes choses concourent au bien de ceux qui aiment Dieu.', book: 45, chapter: 8, verse: 28 },
    { ref: 'Josué 1:9', text: 'Sois fort et courageux. Ne t\'effraie point, car l\'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.', book: 6, chapter: 1, verse: 9 },
    { ref: 'Matthieu 11:28', text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.', book: 40, chapter: 11, verse: 28 },
    { ref: 'Ésaïe 40:31', text: 'Ceux qui se confient en l\'Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent et ne se lassent point.', book: 23, chapter: 40, verse: 31 },
    { ref: 'Psaumes 46:1', text: 'Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.', book: 19, chapter: 46, verse: 1 },
    { ref: 'Proverbes 3:5-6', text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse. Reconnais-le dans toutes tes voies, et il aplanira tes sentiers.', book: 20, chapter: 3, verse: 5 },
    { ref: 'Jérémie 29:11', text: 'Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance.', book: 24, chapter: 29, verse: 11 },
    { ref: 'Romains 8:38-39', text: 'Car j\'ai l\'assurance que ni la mort ni la vie, ni les anges ni les dominations, ni les choses présentes ni les choses à venir, ni les puissances, ni la hauteur ni la profondeur, ni aucune autre créature ne pourra nous séparer de l\'amour de Dieu manifesté en Jésus-Christ notre Seigneur.', book: 45, chapter: 8, verse: 38 },
    { ref: 'Galates 2:20', text: 'J\'ai été crucifié avec Christ ; et si je vis, ce n\'est plus moi qui vis, c\'est Christ qui vit en moi ; si je vis maintenant dans la chair, je vis dans la foi au Fils de Dieu.', book: 48, chapter: 2, verse: 20 },
    { ref: 'Psaumes 119:105', text: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.', book: 19, chapter: 119, verse: 105 },
    { ref: 'Matthieu 5:3-5', text: 'Heureux ceux qui ont le cœur humble, car le royaume des cieux est à eux. Heureux ceux qui pleurent, car ils seront consolés. Heureux les débonnaires, car ils hériteront la terre.', book: 40, chapter: 5, verse: 3 },
    { ref: '1 Corinthiens 13:4-7', text: 'L\'amour est patient, il est plein de bonté ; l\'amour n\'est point envieux ; l\'amour ne se vante point, il ne s\'enfle point d\'orgueil, il ne fait rien de malhonnête, il ne cherche point son intérêt, il ne s\'irrite point, il ne soupçonne point le mal, il ne se réjouit point de l\'injustice, mais il se réjouit de la vérité ; il excuse tout, il croit tout, il espère tout, il supporte tout.', book: 46, chapter: 13, verse: 4 },
    { ref: 'Apocalypse 21:4', text: 'Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n\'y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu.', book: 66, chapter: 21, verse: 4 },
    { ref: 'Jean 14:6', text: 'Jésus lui dit : Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.', book: 43, chapter: 14, verse: 6 },
    { ref: 'Éphésiens 2:8-9', text: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est point par les œuvres, afin que personne ne se glorifie.', book: 49, chapter: 2, verse: 8 },
    { ref: 'Psaumes 27:1', text: 'L\'Éternel est ma lumière et mon salut : de qui aurais-je crainte ? L\'Éternel est le soutien de ma vie : de qui aurais-je peur ?', book: 19, chapter: 27, verse: 1 },
    { ref: 'Matthieu 6:33', text: 'Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.', book: 40, chapter: 6, verse: 33 },
    { ref: 'Hébreux 11:1', text: 'Or la foi est une ferme assurance des choses qu\'on espère, une démonstration de celles qu\'on ne voit pas.', book: 58, chapter: 11, verse: 1 },
    { ref: 'Jacques 1:2-4', text: 'Mes frères, regardez comme un sujet de joie complète les diverses épreuves auxquelles vous pouvez vous trouver exposés, sachant que l\'épreuve de votre foi produit la patience. Mais il faut que la patience accomplisse parfaitement son œuvre, afin que vous soyez parfaits et accomplis, sans faillir en rien.', book: 59, chapter: 1, verse: 2 },
    { ref: 'Psaumes 37:4', text: 'Fais de l\'Éternel tes délices, et il te donnera ce que ton cœur désire.', book: 19, chapter: 37, verse: 4 },
    { ref: '2 Timothée 1:7', text: 'Car ce n\'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d\'amour et de sagesse.', book: 55, chapter: 1, verse: 7 },
    { ref: 'Jean 10:10', text: 'Le voleur ne vient que pour dérober, égorger et détruire ; moi, je suis venu afin que les brebis aient la vie, et qu\'elles soient dans l\'abondance.', book: 43, chapter: 10, verse: 10 },
    { ref: 'Ésaïe 41:10', text: 'Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu ; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante.', book: 23, chapter: 41, verse: 10 },
    { ref: 'Romains 12:2', text: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l\'intelligence, afin que vous discerniez quelle est la volonté de Dieu.', book: 45, chapter: 12, verse: 2 },
    { ref: 'Psaumes 91:1-2', text: 'Celui qui demeure sous l\'abri du Très Haut repose à l\'ombre du Tout Puissant. Je dis à l\'Éternel : Mon refuge et ma forteresse, mon Dieu en qui je me confie.', book: 19, chapter: 91, verse: 1 },
    { ref: 'Philippiens 4:6-7', text: 'Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ.', book: 50, chapter: 4, verse: 6 },
    { ref: 'Lamentations 3:22-23', text: 'Les bontés de l\'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin. Ta fidélité est grande.', book: 25, chapter: 3, verse: 22 },
    { ref: '1 Jean 4:8', text: 'Celui qui n\'aime pas n\'a pas connu Dieu, car Dieu est amour.', book: 62, chapter: 4, verse: 8 },
  ],
  en: [
    { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', book: 43, chapter: 3, verse: 16 },
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', book: 50, chapter: 4, verse: 13 },
    { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.', book: 19, chapter: 23, verse: 1 },
    { ref: 'Romans 8:28', text: 'All things work together for good to them that love God.', book: 45, chapter: 8, verse: 28 },
    { ref: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', book: 6, chapter: 1, verse: 9 },
    { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', book: 40, chapter: 11, verse: 28 },
    { ref: 'Isaiah 40:31', text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.', book: 23, chapter: 40, verse: 31 },
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', book: 19, chapter: 46, verse: 1 },
    { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', book: 20, chapter: 3, verse: 5 },
    { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', book: 24, chapter: 29, verse: 11 },
    { ref: 'Romans 8:38-39', text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.', book: 45, chapter: 8, verse: 38 },
    { ref: 'Galatians 2:20', text: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God.', book: 48, chapter: 2, verse: 20 },
    { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.', book: 19, chapter: 119, verse: 105 },
    { ref: 'Matthew 5:3-5', text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven. Blessed are they that mourn: for they shall be comforted. Blessed are the meek: for they shall inherit the earth.', book: 40, chapter: 5, verse: 3 },
    { ref: '1 Corinthians 13:4-7', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; rejoiceth not in iniquity, but rejoiceth in the truth; beareth all things, believeth all things, hopeth all things, endureth all things.', book: 46, chapter: 13, verse: 4 },
    { ref: 'Revelation 21:4', text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain.', book: 66, chapter: 21, verse: 4 },
    { ref: 'John 14:6', text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', book: 43, chapter: 14, verse: 6 },
    { ref: 'Ephesians 2:8-9', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: not of works, lest any man should boast.', book: 49, chapter: 2, verse: 8 },
    { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear? The LORD is the strength of my life; of whom shall I be afraid?', book: 19, chapter: 27, verse: 1 },
    { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', book: 40, chapter: 6, verse: 33 },
    { ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', book: 58, chapter: 11, verse: 1 },
    { ref: 'James 1:2-4', text: 'My brethren, count it all joy when ye fall into divers temptations; knowing this, that the trying of your faith worketh patience. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.', book: 59, chapter: 1, verse: 2 },
    { ref: 'Psalm 37:4', text: 'Delight thyself also in the LORD: and he shall give thee the desires of thine heart.', book: 19, chapter: 37, verse: 4 },
    { ref: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', book: 55, chapter: 1, verse: 7 },
    { ref: 'John 10:10', text: 'The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.', book: 43, chapter: 10, verse: 10 },
    { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.', book: 23, chapter: 41, verse: 10 },
    { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.', book: 45, chapter: 12, verse: 2 },
    { ref: 'Psalm 91:1-2', text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.', book: 19, chapter: 91, verse: 1 },
    { ref: 'Philippians 4:6-7', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', book: 50, chapter: 4, verse: 6 },
    { ref: 'Lamentations 3:22-23', text: 'It is of the LORD\'s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.', book: 25, chapter: 3, verse: 22 },
    { ref: '1 John 4:8', text: 'He that loveth not knoweth not God; for God is love.', book: 62, chapter: 4, verse: 8 },
  ],
  mg: [
    { ref: 'Jaona 3:16', text: 'Fa toy izany no nitiavan\'Andriamanitra izao tontolo izao, ka dia nomeny ny Zanani-lahy Tokana, mba tsy ho very izay rehetra mino Azy, fa hanana fiainana mandrakizay.', book: 43, chapter: 3, verse: 16 },
    { ref: 'Filipiana 4:13', text: 'Mahay manampy ny zavatra rehetra aho ao amin\'izay mampahery ahy.', book: 50, chapter: 4, verse: 13 },
    { ref: 'Salamo 23:1', text: 'Jehova no Mpiandry ahy; tsy hanan-java-mahory aho.', book: 19, chapter: 23, verse: 1 },
    { ref: 'Romana 8:28', text: 'Ary fantatsika fa ny zavatra rehetra dia miara-miasa hahasoa izay tia an\'Andriamanitra.', book: 45, chapter: 8, verse: 28 },
    { ref: 'Josoa 1:9', text: 'Mahereza sy matanjaha; aza matahotra na mivadi-po; fa Jehova Andriamanitrao no momba anao.', book: 6, chapter: 1, verse: 9 },
    { ref: 'Matio 11:28', text: 'Avia atỳ amiko, ianareo rehetra izay miasa fatratra sy mavesatra entana, dia hampisitrika anareo Aho.', book: 40, chapter: 11, verse: 28 },
    { ref: 'Isaia 40:31', text: 'Fa izay maharitra an\'i Jehova no hahazoa-kery vaovao; hanidina toy ny voromahery izy.', book: 23, chapter: 40, verse: 31 },
    { ref: 'Salamo 46:1', text: 'Andriamanitra no fialofantsika sy heritsika, ary famonjena hita nefa be dia be amin\'ny fahoriana.', book: 19, chapter: 46, verse: 1 },
    { ref: 'Ohabolana 3:5-6', text: 'Matoky an\'i Jehova amin\'ny fonao rehetra ianao, fa aza miankina amin\'ny fahalalanao. Ekeo Izy amin\'ny làlanao rehetra, dia Izy hanamboatra ny làlanao.', book: 20, chapter: 3, verse: 5 },
    { ref: 'Jeremia 29:11', text: 'Fa Izaho mahalala ny hevitra izay mandroso aminao, hoy Jehova, dia hevitra fiadanana fa tsy loza, mba hanome anao ny farany sy ny fanantenana.', book: 24, chapter: 29, verse: 11 },
    { ref: 'Romana 8:38-39', text: 'Fa matoky aho fa na fahafatesana na fiainana, na anjely na fanapahana, na zavatra ankehitriny na zavatra ho avy, na hery, na avo na lalina, na zavatra voary hafa tsy mahay misaraka antsika amin\'ny fitiavan\'Andriamanitra izay ao amin\'i Kristy Jesoa Tompontsika.', book: 45, chapter: 8, verse: 38 },
    { ref: 'Galatiana 2:20', text: 'Efa niara-nofantsihana tamin\'i Kristy aho; fa velona aho, nefa tsy izaho intsony, fa Kristy no velona ato amiko.', book: 48, chapter: 2, verse: 20 },
    { ref: 'Salamo 119:105', text: 'Ny teninao no jiro amin\'ny tongotro sy fahazavana amin\'ny lalako.', book: 19, chapter: 119, verse: 105 },
    { ref: 'Matio 5:3-5', text: 'Sambatra ny malahelo am-panahy; fa azy ny fanjakan\'ny lanitra. Sambatra ny misento; fa izy no hohesorana. Sambatra ny malemy fanahy; fa izy no handova ny tany.', book: 40, chapter: 5, verse: 3 },
    { ref: '1 Korintiana 13:4-7', text: 'Ny fitiavana dia maharitra sady miantra; ny fitiavana tsy mialona; ny fitiavana tsy mirehareha, tsy mivofotra, tsy mahafa-baraka, tsy mitady ny azy, tsy mora sosotra, tsy misaina ratsy; tsy mifaly amin\'ny tsy fahamarinana, fa mifaly amin\'ny fahamarinana; miheriny ny zavatra rehetra, inoan\'ny zavatra rehetra, antenain\'ny zavatra rehetra, onjan\'ny zavatra rehetra.', book: 46, chapter: 13, verse: 4 },
    { ref: 'Apokalipsy 21:4', text: 'Ary hofafan\'Andriamanitra ny ranomaso rehetra amin\'ny masony; ary ny fahafatesana tsy hisy intsony, sady tsy hisy intsony ny alahelo na ny fitarainana na ny fanaintainana.', book: 66, chapter: 21, verse: 4 },
    { ref: 'Jaona 14:6', text: 'Hoy Jesoa taminy: Izaho no lalana sy fahamarinana ary fiainana; tsy misy olona mankany amin\'ny Ray afa-tsy amin\'ny alako.', book: 43, chapter: 14, verse: 6 },
    { ref: 'Efesiana 2:8-9', text: 'Fa fahasoavana no namonjena anareo amin\'ny finoana; ary tsy avy aminareo izany, fa fanomezana avy amin\'Andriamanitra; tsy avy amin\'ny asa, fandrao hisy hirehareha.', book: 49, chapter: 2, verse: 8 },
    { ref: 'Salamo 27:1', text: 'Jehova no fahazavako sy famonjena ahy; iza no hatahorako? Jehova no fialofan\'ny aiko; iza no hampangovitra ahy?', book: 19, chapter: 27, verse: 1 },
    { ref: 'Matio 6:33', text: 'Fa katsaho aloha ny fanjakany sy ny fahamarinany, dia hanampy ny zavatra rehetra ho anareo izany.', book: 40, chapter: 6, verse: 33 },
    { ref: 'Hebreo 11:1', text: 'Fa ny finoana no fototra enti-manantena ny zavatra antenaina sy porofo ny zavatra tsy hita.', book: 58, chapter: 11, verse: 1 },
    { ref: 'Jakoba 1:2-4', text: 'Aoka ho fifaliana avokoa aminareo, ry rahalahy, raha latsaka amin\'ny fakam-panahy samy hafa ianareo, satria fantatrareo fa ny fizahana ny finoanareo dia mamokatra faharetana. Fa aoka ny faharetana hanatanteraka ny asany tsara, mba ho lavorary sy tanteraka ianareo, ka tsy hisy hanafahana anareo.', book: 59, chapter: 1, verse: 2 },
    { ref: 'Salamo 37:4', text: 'Mifalia ao amin\'i Jehova ianao, dia homeny anao izay takian\'ny fonao.', book: 19, chapter: 37, verse: 4 },
    { ref: '2 Timoteo 1:7', text: 'Fa tsy fanahy fahatahorana no nomen\'Andriamanitra antsika, fa fanahy faherezana sy fitiavana ary fahadiovam-panahy.', book: 55, chapter: 1, verse: 7 },
    { ref: 'Jaona 10:10', text: 'Ny mpangalatra tsy avy afa-tsy hangalatra sy hamono ary handringana; Izaho no tonga mba hanana fiainana izy ireo, ary hanana azy be dia be.', book: 43, chapter: 10, verse: 10 },
    { ref: 'Isaia 41:10', text: 'Aza matahotra ianao, fa momba anao Aho; aza manaritarita ianao, fa Izaho no Andriamanitrao; hampahery anao Aho, eny, hamonjy anao Aho; eny, hitantana anao amin\'ny tanako havanana marina Aho.', book: 23, chapter: 41, verse: 10 },
    { ref: 'Romana 12:2', text: 'Ary aza manahaka izao firenena izao; fa matoa mova amin\'ny fanavaozana ny sainareo, mba hahay hamantatra izay sitrapon\'Andriamanitra.', book: 45, chapter: 12, verse: 2 },
    { ref: 'Salamo 91:1-2', text: 'Izay mitoetra ao amin\'ny fierena ny Avo Indrindra dia mitoetra ao amin\'ny aloky ny Tsitoha. Hanao aho hoe amin\'i Jehova: Fiarovana sy fiatoako Izy, Andriamanitro izay itokiako.', book: 19, chapter: 91, verse: 1 },
    { ref: 'Filipiana 4:6-7', text: 'Aza manahy na inona na inona; fa amin\'ny zavatra rehetra ataovy fantatr\'Andriamanitra ny fangatahanareo amin\'ny vavaka sy ny fangatahana mbamin\'ny fisaorana. Ary ny fiadanan\'Andriamanitra, izay mihoatra noho ny fahalalana rehetra, no hiambina ny fonareo sy ny sainareo ao amin\'i Kristy Jesoa.', book: 50, chapter: 4, verse: 6 },
    { ref: 'Fitomaniana 3:22-23', text: 'Tsy mby amin\'ny farany ny famindrampon\'i Jehova, fa tsy lany ny fiantrany; vaovao isan\'andro izany; lehibe ny fahamarinanao.', book: 25, chapter: 3, verse: 22 },
    { ref: '1 Jaona 4:8', text: 'Izay tsy tia dia tsy mahalala an\'Andriamanitra; fa Andriamanitra dia fitiavana.', book: 62, chapter: 4, verse: 8 },
  ],
};
//24 paraboles et 20 miracles en total dans le feed
// ─────────────────────────────────────────────────────────────────────────────
// PARABOLES — toutes les paraboles majeures des évangiles
// ─────────────────────────────────────────────────────────────────────────────
const PARABOLES = {
  fr: [
    { titre: 'Le Fils prodigue', theme: 'Grâce & Pardon', ref: 'Luc 15:11-32', resume: 'Un père court vers son fils égaré qui revient repentant. Cette parabole révèle le cœur du Père céleste.', quote: 'Mon fils que voici était mort, et il est revenu à la vie ; il était perdu, et il est retrouvé.', quoteRef: 'Luc 15:24', book: 42, chapter: 15, startVerse: 11, endVerse: 32 },
    { titre: 'Le Bon Samaritain', theme: 'Amour du Prochain', ref: 'Luc 10:25-37', resume: 'Un étranger méprisé secourt un blessé laissé pour mort. Jésus redéfinit qui est notre prochain.', quote: 'Va, et toi, fais de même.', quoteRef: 'Luc 10:37', book: 42, chapter: 10, startVerse: 25, endVerse: 37 },
    { titre: 'Le Semeur', theme: 'La Parole de Dieu', ref: 'Matthieu 13:1-23', resume: 'Quatre types de terrain, quatre destinées pour la même semence. Comment reçois-tu la Parole ?', quote: 'Celui qui a des oreilles pour entendre, qu\'il entende.', quoteRef: 'Mt 13:9', book: 40, chapter: 13, startVerse: 1, endVerse: 23 },
    { titre: 'Le Grain de Sénevé', theme: 'Le Royaume qui grandit', ref: 'Matthieu 13:31-32', resume: 'La plus petite des semences devient le plus grand des arbustes. Ainsi croît le royaume de Dieu.', quote: 'Il devient un arbre, et les oiseaux du ciel viennent habiter dans ses branches.', quoteRef: 'Mt 13:32', book: 40, chapter: 13, startVerse: 31, endVerse: 32 },
    { titre: 'Le Levain', theme: 'Transformation intérieure', ref: 'Matthieu 13:33', resume: 'Un peu de levain fait lever toute la pâte. Le royaume de Dieu opère silencieusement de l\'intérieur.', quote: 'Le royaume des cieux est semblable à du levain.', quoteRef: 'Mt 13:33', book: 40, chapter: 13, startVerse: 33, endVerse: 33 },
    { titre: 'Le Trésor caché', theme: 'Valeur du Royaume', ref: 'Matthieu 13:44', resume: 'Un homme trouve un trésor et vend tout ce qu\'il a pour l\'acheter. Le royaume vaut tout sacrifice.', quote: 'Il s\'en va dans sa joie, vend tout ce qu\'il a, et achète ce champ.', quoteRef: 'Mt 13:44', book: 40, chapter: 13, startVerse: 44, endVerse: 44 },
    { titre: 'La Perle de grand prix', theme: 'Le tout pour le tout', ref: 'Matthieu 13:45-46', resume: 'Un marchand trouve la perle parfaite et donne tout ce qu\'il possède pour l\'acquérir.', quote: 'Il est allé vendre tout ce qu\'il avait, et l\'a achetée.', quoteRef: 'Mt 13:46', book: 40, chapter: 13, startVerse: 45, endVerse: 46 },
    { titre: 'Le Filet', theme: 'Jugement dernier', ref: 'Matthieu 13:47-50', resume: 'Un filet ramasse toutes sortes de poissons. À la fin, les bons seront séparés des mauvais.', quote: 'Les anges sépareront les méchants d\'avec les justes.', quoteRef: 'Mt 13:49', book: 40, chapter: 13, startVerse: 47, endVerse: 50 },
    { titre: 'Les Dix Vierges', theme: 'Vigilance & Préparation', ref: 'Matthieu 25:1-13', resume: 'Cinq vierges sages gardent de l\'huile en réserve ; cinq folles sont surprises à court. Soyez prêts !', quote: 'Veillez donc, car vous ne savez ni le jour ni l\'heure.', quoteRef: 'Mt 25:13', book: 40, chapter: 25, startVerse: 1, endVerse: 13 },
    { titre: 'Les Talents', theme: 'Fidélité & Responsabilité', ref: 'Matthieu 25:14-30', resume: 'Trois serviteurs reçoivent des talents selon leurs capacités. Deux les font fructifier, un les enfouit.', quote: 'C\'est bien, bon et fidèle serviteur ; entre dans la joie de ton maître.', quoteRef: 'Mt 25:21', book: 40, chapter: 25, startVerse: 14, endVerse: 30 },
    { titre: 'Le Serviteur impitoyable', theme: 'Pardon & Miséricorde', ref: 'Matthieu 18:23-35', resume: 'Pardonné d\'une dette immense, un serviteur refuse de pardonner une petite somme à son prochain.', quote: 'Ne devais-tu pas, toi aussi, avoir pitié de ton compagnon ?', quoteRef: 'Mt 18:33', book: 40, chapter: 18, startVerse: 23, endVerse: 35 },
    { titre: 'Les Ouvriers de la Vigne', theme: 'Grâce souveraine', ref: 'Matthieu 20:1-16', resume: 'Des ouvriers embauchés à différentes heures reçoivent le même salaire. La grâce de Dieu est souveraine.', quote: 'Les derniers seront premiers, et les premiers seront derniers.', quoteRef: 'Mt 20:16', book: 40, chapter: 20, startVerse: 1, endVerse: 16 },
    { titre: 'Les Deux Fils', theme: 'Obéissance réelle', ref: 'Matthieu 21:28-32', resume: 'L\'un dit non puis obéit, l\'autre dit oui et ne fait rien. Ce qui compte, c\'est l\'action.', quote: 'Lequel des deux a fait la volonté du père ?', quoteRef: 'Mt 21:31', book: 40, chapter: 21, startVerse: 28, endVerse: 32 },
    { titre: 'Les Vignerons meurtriers', theme: 'Rejet & Jugement', ref: 'Matthieu 21:33-46', resume: 'Des vignerons tuent les serviteurs et le fils du maître. Ils perdent la vigne.', quote: 'La pierre qu\'ont rejetée ceux qui bâtissaient est devenue la principale de l\'angle.', quoteRef: 'Mt 21:42', book: 40, chapter: 21, startVerse: 33, endVerse: 46 },
    { titre: 'Le Festin des noces', theme: 'Invitation au Royaume', ref: 'Matthieu 22:1-14', resume: 'Le roi invite des hôtes qui refusent de venir. Il envoie alors ses serviteurs sur les chemins.', quote: 'Car il y a beaucoup d\'appelés, mais peu d\'élus.', quoteRef: 'Mt 22:14', book: 40, chapter: 22, startVerse: 1, endVerse: 14 },
    { titre: 'La Brebis perdue', theme: 'Joie du Ciel', ref: 'Luc 15:1-7', resume: 'Le berger laisse les 99 pour retrouver la brebis perdue. Grande est la joie au ciel pour un pécheur repentant.', quote: 'Il y aura plus de joie dans le ciel pour un seul pécheur qui se repent.', quoteRef: 'Luc 15:7', book: 42, chapter: 15, startVerse: 1, endVerse: 7 },
    { titre: 'La Drachme perdue', theme: 'Recherche infatigable', ref: 'Luc 15:8-10', resume: 'Une femme cherche sans relâche sa pièce perdue et se réjouit de l\'avoir retrouvée.', quote: 'Il y a de la joie devant les anges de Dieu pour un seul pécheur qui se repent.', quoteRef: 'Luc 15:10', book: 42, chapter: 15, startVerse: 8, endVerse: 10 },
    { titre: 'Le Riche et Lazare', theme: 'Éternité & Justice', ref: 'Luc 16:19-31', resume: 'Le riche festoie, Lazare souffre à sa porte. La mort renverse leurs destins pour l\'éternité.', quote: 'Maintenant il est consolé, et toi, tu souffres.', quoteRef: 'Luc 16:25', book: 42, chapter: 16, startVerse: 19, endVerse: 31 },
    { titre: 'Le Pharisien et le Publicain', theme: 'Humilité & Prière', ref: 'Luc 18:9-14', resume: 'Le pharisien se glorifie, le publicain se frappe la poitrine. Seul le second repart justifié.', quote: 'Dieu, sois apaisé envers moi, qui suis un pécheur.', quoteRef: 'Luc 18:13', book: 42, chapter: 18, startVerse: 9, endVerse: 14 },
    { titre: 'La Maison sur le Roc', theme: 'Fondement solide', ref: 'Matthieu 7:24-27', resume: 'Celui qui pratique la Parole bâtit sur le roc ; celui qui ne la pratique pas bâtit sur le sable.', quote: 'La pluie est tombée, les torrents sont venus, les vents ont soufflé — elle n\'est point tombée.', quoteRef: 'Mt 7:25', book: 40, chapter: 7, startVerse: 24, endVerse: 27 },
    { titre: 'Le Gérant infidèle', theme: 'Usage des biens', ref: 'Luc 16:1-13', resume: 'Un gérant, sur le point d\'être renvoyé, use habilement des biens de son maître pour préparer son avenir.', quote: 'Nul ne peut servir deux maîtres.', quoteRef: 'Luc 16:13', book: 42, chapter: 16, startVerse: 1, endVerse: 13 },
    { titre: 'La Veuve et le Juge', theme: 'Prière persévérante', ref: 'Luc 18:1-8', resume: 'Une veuve harcèle un juge inique jusqu\'à obtenir justice. Ainsi faut-il prier sans se décourager.', quote: 'Ne vous découragez pas dans la prière.', quoteRef: 'Luc 18:1', book: 42, chapter: 18, startVerse: 1, endVerse: 8 },
    { titre: 'Le Berger et les Brebis', theme: 'Voix du Berger', ref: 'Jean 10:1-18', resume: 'Le berger entre par la porte, appelle ses brebis par leur nom, et elles le suivent car elles connaissent sa voix.', quote: 'Je suis la porte des brebis.', quoteRef: 'Jean 10:7', book: 43, chapter: 10, startVerse: 1, endVerse: 18 },
    { titre: 'La Vigne et les Sarments', theme: 'Demeure en Christ', ref: 'Jean 15:1-17', resume: 'Jésus est la vraie vigne, ses disciples sont les sarments. Sans lui, ils ne peuvent rien produire.', quote: 'Demeurez en moi, et je demeurerai en vous.', quoteRef: 'Jean 15:4', book: 43, chapter: 15, startVerse: 1, endVerse: 17 },
  ],
  en: [
    { titre: 'The Prodigal Son', theme: 'Grace & Forgiveness', ref: 'Luke 15:11-32', resume: 'A father runs toward his lost son who returns repentant. This parable reveals the heart of the heavenly Father.', quote: 'This my son was dead, and is alive again; he was lost, and is found.', quoteRef: 'Luke 15:24', book: 42, chapter: 15, startVerse: 11, endVerse: 32 },
    { titre: 'The Good Samaritan', theme: 'Love of Neighbour', ref: 'Luke 10:25-37', resume: 'A despised stranger rescues a wounded man left for dead. Jesus redefines who our neighbour is.', quote: 'Go, and do thou likewise.', quoteRef: 'Luke 10:37', book: 42, chapter: 10, startVerse: 25, endVerse: 37 },
    { titre: 'The Sower', theme: 'The Word of God', ref: 'Matthew 13:1-23', resume: 'Four types of ground, four destinies for the same seed. How do you receive the Word?', quote: 'Who hath ears to hear, let him hear.', quoteRef: 'Mt 13:9', book: 40, chapter: 13, startVerse: 1, endVerse: 23 },
    { titre: 'The Mustard Seed', theme: 'The Growing Kingdom', ref: 'Matthew 13:31-32', resume: 'The smallest of seeds becomes the greatest of shrubs. So grows the kingdom of God.', quote: 'It becometh a tree, so that the birds of the air come and lodge in the branches thereof.', quoteRef: 'Mt 13:32', book: 40, chapter: 13, startVerse: 31, endVerse: 32 },
    { titre: 'The Leaven', theme: 'Inner Transformation', ref: 'Matthew 13:33', resume: 'A little leaven leaveneth the whole lump. The kingdom of God works silently from within.', quote: 'The kingdom of heaven is like unto leaven.', quoteRef: 'Mt 13:33', book: 40, chapter: 13, startVerse: 33, endVerse: 33 },
    { titre: 'The Hidden Treasure', theme: 'Worth of the Kingdom', ref: 'Matthew 13:44', resume: 'A man finds treasure and sells everything to buy the field. The kingdom is worth every sacrifice.', quote: 'For joy thereof goeth and selleth all that he hath, and buyeth that field.', quoteRef: 'Mt 13:44', book: 40, chapter: 13, startVerse: 44, endVerse: 44 },
    { titre: 'The Pearl of Great Price', theme: 'All for Everything', ref: 'Matthew 13:45-46', resume: 'A merchant finds the perfect pearl and gives all he has to acquire it.', quote: 'He went and sold all that he had, and bought it.', quoteRef: 'Mt 13:46', book: 40, chapter: 13, startVerse: 45, endVerse: 46 },
    { titre: 'The Dragnet', theme: 'Final Judgement', ref: 'Matthew 13:47-50', resume: 'A net gathers fish of every kind. At the end, the good will be separated from the wicked.', quote: 'The angels shall sever the wicked from among the just.', quoteRef: 'Mt 13:49', book: 40, chapter: 13, startVerse: 47, endVerse: 50 },
    { titre: 'The Ten Virgins', theme: 'Vigilance & Readiness', ref: 'Matthew 25:1-13', resume: 'Five wise virgins keep oil in reserve; five foolish ones are caught unprepared. Be ready!', quote: 'Watch therefore, for ye know neither the day nor the hour.', quoteRef: 'Mt 25:13', book: 40, chapter: 25, startVerse: 1, endVerse: 13 },
    { titre: 'The Talents', theme: 'Faithfulness & Responsibility', ref: 'Matthew 25:14-30', resume: 'Three servants receive talents according to their abilities. Two multiply them, one buries his.', quote: 'Well done, good and faithful servant; enter thou into the joy of thy lord.', quoteRef: 'Mt 25:21', book: 40, chapter: 25, startVerse: 14, endVerse: 30 },
    { titre: 'The Unforgiving Servant', theme: 'Forgiveness & Mercy', ref: 'Matthew 18:23-35', resume: 'Forgiven an enormous debt, a servant refuses to forgive a small sum owed to him.', quote: 'Shouldest not thou also have had compassion on thy fellowservant?', quoteRef: 'Mt 18:33', book: 40, chapter: 18, startVerse: 23, endVerse: 35 },
    { titre: 'Workers in the Vineyard', theme: 'Sovereign Grace', ref: 'Matthew 20:1-16', resume: 'Workers hired at different hours receive the same wage. God\'s grace is sovereign.', quote: 'So the last shall be first, and the first last.', quoteRef: 'Mt 20:16', book: 40, chapter: 20, startVerse: 1, endVerse: 16 },
    { titre: 'The Two Sons', theme: 'Real Obedience', ref: 'Matthew 21:28-32', resume: 'One says no then obeys; the other says yes and does nothing. What matters is action.', quote: 'Whether of them twain did the will of his father?', quoteRef: 'Mt 21:31', book: 40, chapter: 21, startVerse: 28, endVerse: 32 },
    { titre: 'The Wicked Husbandmen', theme: 'Rejection & Judgement', ref: 'Matthew 21:33-46', resume: 'Tenants kill the servants and the master\'s son. They lose the vineyard.', quote: 'The stone which the builders rejected, the same is become the head of the corner.', quoteRef: 'Mt 21:42', book: 40, chapter: 21, startVerse: 33, endVerse: 46 },
    { titre: 'The Wedding Feast', theme: 'Invitation to the Kingdom', ref: 'Matthew 22:1-14', resume: 'A king invites guests who refuse to come. He sends his servants out to the highways instead.', quote: 'For many are called, but few are chosen.', quoteRef: 'Mt 22:14', book: 40, chapter: 22, startVerse: 1, endVerse: 14 },
    { titre: 'The Lost Sheep', theme: 'Joy in Heaven', ref: 'Luke 15:1-7', resume: 'The shepherd leaves the 99 to find the one lost sheep. Great is the joy in heaven for one repentant sinner.', quote: 'Joy shall be in heaven over one sinner that repenteth.', quoteRef: 'Luke 15:7', book: 42, chapter: 15, startVerse: 1, endVerse: 7 },
    { titre: 'The Lost Coin', theme: 'Tireless Search', ref: 'Luke 15:8-10', resume: 'A woman searches relentlessly for her lost coin and rejoices when she finds it.', quote: 'There is joy in the presence of the angels of God over one sinner that repenteth.', quoteRef: 'Luke 15:10', book: 42, chapter: 15, startVerse: 8, endVerse: 10 },
    { titre: 'The Rich Man and Lazarus', theme: 'Eternity & Justice', ref: 'Luke 16:19-31', resume: 'The rich man feasts while Lazarus suffers at his gate. Death reverses their fates for eternity.', quote: 'Now he is comforted, and thou art tormented.', quoteRef: 'Luke 16:25', book: 42, chapter: 16, startVerse: 19, endVerse: 31 },
    { titre: 'The Pharisee and the Tax Collector', theme: 'Humility & Prayer', ref: 'Luke 18:9-14', resume: 'The Pharisee boasts; the tax collector beats his chest. Only the second goes home justified.', quote: 'God be merciful to me a sinner.', quoteRef: 'Luke 18:13', book: 42, chapter: 18, startVerse: 9, endVerse: 14 },
    { titre: 'The House on the Rock', theme: 'Solid Foundation', ref: 'Matthew 7:24-27', resume: 'He who acts on the Word builds on rock; he who ignores it builds on sand.', quote: 'The rain descended, the floods came, the winds blew — and it fell not.', quoteRef: 'Mt 7:25', book: 40, chapter: 7, startVerse: 24, endVerse: 27 },
    { titre: 'The Unjust Steward', theme: 'Use of Wealth', ref: 'Luke 16:1-13', resume: 'About to be dismissed, a steward cleverly uses his master\'s goods to prepare his future.', quote: 'Ye cannot serve God and mammon.', quoteRef: 'Luke 16:13', book: 42, chapter: 16, startVerse: 1, endVerse: 13 },
    { titre: 'The Persistent Widow', theme: 'Persevering Prayer', ref: 'Luke 18:1-8', resume: 'A widow pesters an unjust judge until she gets justice. So must we pray without giving up.', quote: 'Men ought always to pray, and not to faint.', quoteRef: 'Luke 18:1', book: 42, chapter: 18, startVerse: 1, endVerse: 8 },
    { titre: 'The Shepherd and his Flock', theme: 'The Shepherd\'s Voice', ref: 'John 10:1-18', resume: 'The shepherd enters by the gate, calls his sheep by name, and they follow him for they know his voice.', quote: 'I am the door of the sheep.', quoteRef: 'John 10:7', book: 43, chapter: 10, startVerse: 1, endVerse: 18 },
    { titre: 'The Vine and the Branches', theme: 'Abiding in Christ', ref: 'John 15:1-17', resume: 'Jesus is the true vine, his disciples are the branches. Without him, they can do nothing.', quote: 'Abide in me, and I in you.', quoteRef: 'John 15:4', book: 43, chapter: 15, startVerse: 1, endVerse: 17 },
  ],
  mg: [
    { titre: 'Ny Zanaka Very', theme: 'Fahasoavana & Famelan-keloka', ref: 'Lioka 15:11-32', resume: 'Ny ray mihazakazaka mankany amin\'ny zanany very izay miverina mibebaka.', quote: 'Ity zanako ity efa maty ka velona indray; efa very ka hita.', quoteRef: 'Lio 15:24', book: 42, chapter: 15, startVerse: 11, endVerse: 32 },
    { titre: 'Ny Samaritana Tsara Fanahy', theme: 'Fitiavana ny Namana', ref: 'Lioka 10:25-37', resume: 'Ny vahiny mahantra nanampy ny lehilahy voarary navelana ho faty.', quote: 'Mandehana, ka manaova toy izany koa ianao.', quoteRef: 'Lio 10:37', book: 42, chapter: 10, startVerse: 25, endVerse: 37 },
    { titre: 'Ny Mpamboly', theme: 'Ny Tenin\'Andriamanitra', ref: 'Matio 13:1-23', resume: 'Karazam-tany efatra, anjara efatra ho an\'ny voa iray. Ahoana no fandraisan\'ny fonao ny Teny?', quote: 'Izay manan-tsofina handre, aoka izy handre.', quoteRef: 'Mat 13:9', book: 40, chapter: 13, startVerse: 1, endVerse: 23 },
    { titre: 'Ny Voan-dry Fitsiny', theme: 'Ny Fanjakana Mihamabe', ref: 'Matio 13:31-32', resume: 'Ny voanjo kely indrindra lasa hazo lehibe. Toy izany no fitomboan\'ny fanjakan\'Andriamanitra.', quote: 'Lasa hazo izy, ka ny voro-manidina avy mitoetra amin\'ny sampany.', quoteRef: 'Mat 13:32', book: 40, chapter: 13, startVerse: 31, endVerse: 32 },
    { titre: 'Ny Masirasira', theme: 'Fiovana ao Anaty', ref: 'Matio 13:33', resume: 'Ny masirasira kely mahasampona ny raha manontolo. Miasa mangingina ny fanjakan\'Andriamanitra.', quote: 'Ny fanjakan\'ny lanitra dia tahaka ny masirasira.', quoteRef: 'Mat 13:33', book: 40, chapter: 13, startVerse: 33, endVerse: 33 },
    { titre: 'Ny Harena Niafina', theme: 'Sandrin\'ny Fanjakana', ref: 'Matio 13:44', resume: 'Ny lehilahy nahita harena niafina nivarotra ny fananany rehetra mba hividy ilay saha.', quote: 'Noho ny fifaliana dia lasa izy ka mivarotra izay rehetra ananany.', quoteRef: 'Mat 13:44', book: 40, chapter: 13, startVerse: 44, endVerse: 44 },
    { titre: 'Ny Perla Soa', theme: 'Ny Avokoa ho an\'ny Zavatra Rehetra', ref: 'Matio 13:45-46', resume: 'Ny mpivarotra nahita perla soa dia nivarotra ny fananany rehetra mba hahazoany azy.', quote: 'Lasa izy ka nivarotra izay rehetra nananany, ka nividy azy.', quoteRef: 'Mat 13:46', book: 40, chapter: 13, startVerse: 45, endVerse: 46 },
    { titre: 'Ny Harato', theme: 'Fitsarana Farany', ref: 'Matio 13:47-50', resume: 'Ny harato mamangona hazandrano karazana maro. Farany ny tsara sy ny ratsy dia sarahina.', quote: 'Ny anjely hampisaraka ny ratsy fanahy amin\'ny marina.', quoteRef: 'Mat 13:49', book: 40, chapter: 13, startVerse: 47, endVerse: 50 },
    { titre: 'Ny Virijiny Folo', theme: 'Fiambinana & Fiomananana', ref: 'Matio 25:1-13', resume: 'Virijiny dimy hendry ny nitahiry menaka; dimy adala no nogadraina. Miezaha ho vonona!', quote: 'Miambena àry, fa tsy fantatrareo ny andro na ny ora.', quoteRef: 'Mat 25:13', book: 40, chapter: 25, startVerse: 1, endVerse: 13 },
    { titre: 'Ny Talenta', theme: 'Fahamarinana & Andraikitra', ref: 'Matio 25:14-30', resume: 'Mpanompo telo nahazo talenta araka ny fahafahan\'izy ireo. Roa nampamokatra azy, iray nanafina.', quote: 'Tsara sady mpanompo mahatoky; midira amin\'ny fifalian\'ny tompoanao.', quoteRef: 'Mat 25:21', book: 40, chapter: 25, startVerse: 14, endVerse: 30 },
    { titre: 'Ny Mpanompo Tsy Miantra', theme: 'Famelan-keloka & Famindrampo', ref: 'Matio 18:23-35', resume: 'Nafoizana trosa lehibe izy fa tsy nety nela-keloka ny namany nanatevina azy trosa kely.', quote: 'Tsy tokony hamindra fo taminao koa ny namanao?', quoteRef: 'Mat 18:33', book: 40, chapter: 18, startVerse: 23, endVerse: 35 },
    { titre: 'Ny Mpiasa tao an-Tanim-Boaloboka', theme: 'Fahasoavana Fahefan\'Andriamanitra', ref: 'Matio 20:1-16', resume: 'Mpiasa nalaina tamin\'ny ora samihafa dia nahazo karama mitovy. Ny fahasoavan\'Andriamanitra dia fara-tampony.', quote: 'Ny farany ho voalohan\'ny alehany, ary ny voalohany ho farany.', quoteRef: 'Mat 20:16', book: 40, chapter: 20, startVerse: 1, endVerse: 16 },
    { titre: 'Ny Zanaka Lahy Roa', theme: 'Fankatoavana Marina', ref: 'Matio 21:28-32', resume: 'Ny anankiray nilaza hoe tsia nefa nankatò; ny anankiray nilaza hoe eny nefa tsy nanao. Ny atao no zava-dehibe.', quote: 'Iza amin\'izy roalahy no nanao ny sitrapon\'ny rainy?', quoteRef: 'Mat 21:31', book: 40, chapter: 21, startVerse: 28, endVerse: 32 },
    { titre: 'Ny Mpamono Mpamboatra', theme: 'Fandavana & Fitsarana', ref: 'Matio 21:33-46', resume: 'Ny mpamboatra namono ny mpanompo sy ny zanaky ny tompony ary very ny tanim-boaloboka.', quote: 'Ny vato nolavin\'ny mpanao trano no tonga fehizoro.', quoteRef: 'Mat 21:42', book: 40, chapter: 21, startVerse: 33, endVerse: 46 },
    { titre: 'Ny Fampakaram-Bady', theme: 'Antso ho amin\'ny Fanjakana', ref: 'Matio 22:1-14', resume: 'Ny mpanjaka nanasa vahiny izay nandà tsy tonga. Nirahin\'izy ny mpanompony teny an-dalana.', quote: 'Fa maro no voantso, fa vitsy no voafidy.', quoteRef: 'Mat 22:14', book: 40, chapter: 22, startVerse: 1, endVerse: 14 },
    { titre: 'Ny Ondry Very', theme: 'Fifaliana any an-Danitra', ref: 'Lioka 15:1-7', resume: 'Ny mpiandry nilaoza ny 99 hitady ny ondry very iray. Lehibe ny fifaliana any an-danitra noho ny mpanota mibebaka.', quote: 'Hisy fifaliana any an-danitra noho ny mpanota iray mibebaka.', quoteRef: 'Lio 15:7', book: 42, chapter: 15, startVerse: 1, endVerse: 7 },
    { titre: 'Ny Drakema Very', theme: 'Fikarohana Tsy Kivy', ref: 'Lioka 15:8-10', resume: 'Ny vehivavy nitady tsy an-tsahatra ny sikajiny very ary nifaly rehefa hita.', quote: 'Misy fifaliana eo anatrehan\'ny anjelin\'Andriamanitra noho ny mpanota iray mibebaka.', quoteRef: 'Lio 15:10', book: 42, chapter: 15, startVerse: 8, endVerse: 10 },
    { titre: 'Ny Mpahantra sy Lazara', theme: 'Fandrosoana & Fahamarinana', ref: 'Lioka 16:19-31', resume: 'Ny mpahantra nihinana be; Lazara nijaly teo am-baravarana. Ny fahafatesana nanova ny anjaran\'izy ireo.', quote: 'Ankehitriny izy no ampiononina, ary ianao kosa mijaly.', quoteRef: 'Lio 16:25', book: 42, chapter: 16, startVerse: 19, endVerse: 31 },
    { titre: 'Ny Fariseo sy ny Mpamory Hetra', theme: 'Fanetren-tena & Vavaka', ref: 'Lioka 18:9-14', resume: 'Ny fariseo nirehareha; ny mpamory hetra nively tratry ny tratrany. Ny faharoa irery no nody voatsy.', quote: 'Andriamanitra o, mamindrà fo amiko mpanota.', quoteRef: 'Lio 18:13', book: 42, chapter: 18, startVerse: 9, endVerse: 14 },
    { titre: 'Ny Trano tao amin\'ny Vatolampy', theme: 'Fototra Mafy', ref: 'Matio 7:24-27', resume: 'Izay mampihatra ny Teny dia manao trano amin\'ny vato; izay tsy mampihatra dia amin\'ny fasika.', quote: 'Nilatsaka ny ranonorana, nisy tondra-drano, nisy rivotra — tsy nianjera izy.', quoteRef: 'Mat 7:25', book: 40, chapter: 7, startVerse: 24, endVerse: 27 },
    { titre: 'Ny Mpikarakara Tsy Mahatoky', theme: 'Fampiasana ny Harena', ref: 'Lioka 16:1-13', resume: 'Mpikarakara efa hanondrahana nanampiasa ny fananaky ny tompony mba hiomana ny ho avy.', quote: 'Tsy misy olona mahatohana tompo roa.', quoteRef: 'Lio 16:13', book: 42, chapter: 16, startVerse: 1, endVerse: 13 },
    { titre: 'Ny Mpitondratena sy ny Mpitsara', theme: 'Vavaka Maharitra', ref: 'Lioka 18:1-8', resume: 'Ny mpitondratena nampijaly mpitsara tsy marina mandra-pahazoany rariny. Toy izany no tokony hivavahana tsy kivy.', quote: 'Mila mivavaka lalandava sy tsy ho kivy ny olona.', quoteRef: 'Lio 18:1', book: 42, chapter: 18, startVerse: 1, endVerse: 8 },
    { titre: 'Ny Mpiandry sy ny Ondry', theme: 'Feon\'ny Mpiandry', ref: 'Jaona 10:1-18', resume: 'Ny mpiandry miditra amin\'ny varavarana, miantso ny ondriny amin\'ny anarany, ary izy ireo manaraka azy.', quote: 'Izaho no varavarana ho an\'ny ondry.', quoteRef: 'Jao 10:7', book: 43, chapter: 10, startVerse: 1, endVerse: 18 },
    { titre: 'Ny Voaloboka sy ny Sampany', theme: 'Mitoetra ao amin\'i Kristy', ref: 'Jaona 15:1-17', resume: 'I Jesoa no voaloboka marina, ny mpianany ny sampany. Raha tsy misy Azy, tsy mahay manao na inona na inona izy ireo.', quote: 'Mitoera ao amiko, ary Izaho ao aminareo.', quoteRef: 'Jao 15:4', book: 43, chapter: 15, startVerse: 1, endVerse: 17 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MIRACLES — tous les miracles majeurs de Jésus
// ─────────────────────────────────────────────────────────────────────────────
const MIRACLES = {
  fr: [
    { titre: 'Les Noces de Cana', theme: 'Gloire révélée', ref: 'Jean 2:1-11', resume: 'Jésus transforme l\'eau en vin lors d\'un festin de noces. C\'est son premier signe.', quote: 'Il manifesta sa gloire, et ses disciples crurent en lui.', quoteRef: 'Jean 2:11', book: 43, chapter: 2, startVerse: 1, endVerse: 11 },
    { titre: 'La Tempête Apaisée', theme: 'Seigneur des éléments', ref: 'Marc 4:35-41', resume: 'Jésus commande aux vents et à la mer, et il se fait un grand calme.', quote: 'Silence ! Tais-toi !', quoteRef: 'Marc 4:39', book: 41, chapter: 4, startVerse: 35, endVerse: 41 },
    { titre: 'La Marche sur les Eaux', theme: 'Foi & Doute', ref: 'Matthieu 14:22-33', resume: 'Jésus marche sur la mer vers ses disciples. Pierre tente de le rejoindre mais sombre dans le doute.', quote: 'Homme de peu de foi, pourquoi as-tu douté ?', quoteRef: 'Mt 14:31', book: 40, chapter: 14, startVerse: 22, endVerse: 33 },
    { titre: 'La Multiplication des Pains', theme: 'Providence divine', ref: 'Jean 6:1-15', resume: 'Avec cinq pains et deux poissons, Jésus rassasie cinq mille hommes et il reste douze paniers.', quote: 'Rassemblez les morceaux qui restent, afin que rien ne se perde.', quoteRef: 'Jean 6:12', book: 43, chapter: 6, startVerse: 1, endVerse: 15 },
    { titre: 'La Résurrection de Lazare', theme: 'Je suis la Résurrection', ref: 'Jean 11:1-45', resume: 'Lazare est mort depuis quatre jours. Jésus pleure, puis crie d\'une voix forte et Lazare sort du tombeau.', quote: 'Je suis la résurrection et la vie. Celui qui croit en moi vivra.', quoteRef: 'Jean 11:25', book: 43, chapter: 11, startVerse: 1, endVerse: 45 },
    { titre: 'La Guérison de l\'Aveugle-né', theme: 'Je suis la Lumière', ref: 'Jean 9:1-41', resume: 'Jésus fait de la boue avec de la terre et de la salive et l\'applique sur les yeux d\'un aveugle de naissance.', quote: 'Je suis la lumière du monde.', quoteRef: 'Jean 9:5', book: 43, chapter: 9, startVerse: 1, endVerse: 41 },
    { titre: 'La Guérison du Paralytique', theme: 'Autorité de pardonner', ref: 'Marc 2:1-12', resume: 'Quatre hommes percent le toit pour descendre leur ami paralytique devant Jésus, qui lui pardonne d\'abord ses péchés.', quote: 'Lève-toi, prends ton lit, et marche.', quoteRef: 'Marc 2:11', book: 41, chapter: 2, startVerse: 1, endVerse: 12 },
    { titre: 'La Guérison des Dix Lépreux', theme: 'Gratitude & Foi', ref: 'Luc 17:11-19', resume: 'Dix lépreux sont guéris mais un seul — un Samaritain — revient remercier Jésus.', quote: 'Ne sont-ce pas là dix qui ont été purifiés ? Et les neuf autres, où sont-ils ?', quoteRef: 'Luc 17:17', book: 42, chapter: 17, startVerse: 11, endVerse: 19 },
    { titre: 'La Femme au Flux de Sang', theme: 'Foi qui touche', ref: 'Marc 5:25-34', resume: 'Une femme malade depuis douze ans touche le bord du vêtement de Jésus. Elle est aussitôt guérie.', quote: 'Ta foi t\'a sauvée ; va en paix, et sois guérie.', quoteRef: 'Marc 5:34', book: 41, chapter: 5, startVerse: 25, endVerse: 34 },
    { titre: 'La Résurrection de la Fille de Jaïrus', theme: 'L\'enfant n\'est que dans le sommeil', ref: 'Marc 5:21-43', resume: 'La fille du chef de synagogue meurt. Jésus la saisit par la main et dit : Talitha koumi.', quote: 'Talitha koumi — Jeune fille, je te le dis, lève-toi.', quoteRef: 'Marc 5:41', book: 41, chapter: 5, startVerse: 21, endVerse: 43 },
    { titre: 'La Guérison d\'un Sourd-Muet', theme: 'Ephphatha — Ouvre-toi', ref: 'Marc 7:31-37', resume: 'Jésus met ses doigts dans les oreilles d\'un sourd-muet et dit Ephphatha, et la langue se délie.', quote: 'Ephphatha, c\'est-à-dire : Ouvre-toi.', quoteRef: 'Marc 7:34', book: 41, chapter: 7, startVerse: 31, endVerse: 37 },
    { titre: 'L\'Homme à la Main desséchée', theme: 'Guérir le jour du sabbat', ref: 'Marc 3:1-6', resume: 'Jésus guérit un homme le jour du sabbat, défiant les pharisiens. Est-il permis de faire du bien le sabbat ?', quote: 'Étends ta main.', quoteRef: 'Marc 3:5', book: 41, chapter: 3, startVerse: 1, endVerse: 6 },
    { titre: 'La Pêche Miraculeuse', theme: 'Abondance et appel', ref: 'Luc 5:1-11', resume: 'Après une nuit blanche, Pierre jette le filet sur la parole de Jésus et ramène une prise prodigieuse.', quote: 'Dès maintenant tu seras pêcheur d\'hommes.', quoteRef: 'Luc 5:10', book: 42, chapter: 5, startVerse: 1, endVerse: 11 },
    { titre: 'Jésus guérit un Démoniaque', theme: 'Autorité sur les esprits', ref: 'Marc 1:21-28', resume: 'À la synagogue de Capernaüm, Jésus ordonne à un esprit impur de sortir. L\'esprit obéit.', quote: 'Tais-toi et sors de cet homme.', quoteRef: 'Marc 1:25', book: 41, chapter: 1, startVerse: 21, endVerse: 28 },
    { titre: 'La Guérison de la Belle-mère de Pierre', theme: 'Puissance qui libère', ref: 'Marc 1:29-31', resume: 'Jésus prend la main de la belle-mère de Pierre, fiévreuse, et la fièvre la quitte aussitôt.', quote: 'La fièvre la quitta, et elle les servait.', quoteRef: 'Marc 1:31', book: 41, chapter: 1, startVerse: 29, endVerse: 31 },
    { titre: 'La Guérison du Serviteur du Centenier', theme: 'Foi qui étonne', ref: 'Matthieu 8:5-13', resume: 'Un centenier demande à Jésus de guérir son serviteur à distance. Sa foi étonne Jésus lui-même.', quote: 'Je n\'ai pas trouvé une si grande foi, même en Israël.', quoteRef: 'Mt 8:10', book: 40, chapter: 8, startVerse: 5, endVerse: 13 },
    { titre: 'La Résurrection du Fils de la Veuve', theme: 'Compassion de Jésus', ref: 'Luc 7:11-17', resume: 'À Naïn, Jésus touche le cercueil d\'un jeune homme fils unique d\'une veuve et le rappelle à la vie.', quote: 'Jeune homme, je te le dis, lève-toi.', quoteRef: 'Luc 7:14', book: 42, chapter: 7, startVerse: 11, endVerse: 17 },
    { titre: 'La Guérison d\'un Hydropique', theme: 'Miséricorde sans frontière', ref: 'Luc 14:1-6', resume: 'Jésus guérit un homme atteint d\'hydropisie le jour du sabbat, chez un chef des pharisiens.', quote: 'Est-il permis de guérir le sabbat, oui ou non ?', quoteRef: 'Luc 14:3', book: 42, chapter: 14, startVerse: 1, endVerse: 6 },
    { titre: 'La Seconde Pêche Miraculeuse', theme: 'Restauration & Mission', ref: 'Jean 21:1-14', resume: 'Après la résurrection, Jésus apparaît au bord du lac. À sa parole, le filet se remplit de 153 grands poissons.', quote: 'Jetez le filet du côté droit de la barque, et vous en trouverez.', quoteRef: 'Jean 21:6', book: 43, chapter: 21, startVerse: 1, endVerse: 14 },
    { titre: 'La Guérison du Fils d\'un Noble', theme: 'Parole qui guérit à distance', ref: 'Jean 4:46-54', resume: 'Un officier royal supplie Jésus de guérir son fils mourant. Jésus prononce une seule parole — et l\'enfant vit.', quote: 'Va, ton fils vit.', quoteRef: 'Jean 4:50', book: 43, chapter: 4, startVerse: 46, endVerse: 54 },
  ],
  en: [
    { titre: 'Wedding at Cana', theme: 'Glory Revealed', ref: 'John 2:1-11', resume: 'Jesus turns water into wine at a wedding feast. This is his first sign.', quote: 'He manifested forth his glory; and his disciples believed on him.', quoteRef: 'John 2:11', book: 43, chapter: 2, startVerse: 1, endVerse: 11 },
    { titre: 'Calming the Storm', theme: 'Lord of Creation', ref: 'Mark 4:35-41', resume: 'Jesus commands the wind and sea, and there is a great calm.', quote: 'Peace, be still.', quoteRef: 'Mark 4:39', book: 41, chapter: 4, startVerse: 35, endVerse: 41 },
    { titre: 'Walking on Water', theme: 'Faith & Doubt', ref: 'Matthew 14:22-33', resume: 'Jesus walks on the sea. Peter tries to join him but sinks in doubt.', quote: 'O thou of little faith, wherefore didst thou doubt?', quoteRef: 'Mt 14:31', book: 40, chapter: 14, startVerse: 22, endVerse: 33 },
    { titre: 'Feeding the Five Thousand', theme: 'Divine Providence', ref: 'John 6:1-15', resume: 'With five loaves and two fish, Jesus feeds five thousand men with twelve baskets left over.', quote: 'Gather up the fragments that remain, that nothing be lost.', quoteRef: 'John 6:12', book: 43, chapter: 6, startVerse: 1, endVerse: 15 },
    { titre: 'Raising of Lazarus', theme: 'I Am the Resurrection', ref: 'John 11:1-45', resume: 'Lazarus has been dead four days. Jesus weeps, then cries with a loud voice and Lazarus walks out.', quote: 'I am the resurrection, and the life: he that believeth in me shall never die.', quoteRef: 'John 11:25', book: 43, chapter: 11, startVerse: 1, endVerse: 45 },
    { titre: 'Healing the Man Born Blind', theme: 'I Am the Light', ref: 'John 9:1-41', resume: 'Jesus makes clay with earth and saliva and applies it to the eyes of a man born blind.', quote: 'I am the light of the world.', quoteRef: 'John 9:5', book: 43, chapter: 9, startVerse: 1, endVerse: 41 },
    { titre: 'Healing the Paralytic', theme: 'Authority to Forgive', ref: 'Mark 2:1-12', resume: 'Four men break through the roof to lower their paralysed friend before Jesus, who first forgives his sins.', quote: 'Arise, and take up thy bed, and walk.', quoteRef: 'Mark 2:11', book: 41, chapter: 2, startVerse: 1, endVerse: 12 },
    { titre: 'Healing the Ten Lepers', theme: 'Gratitude & Faith', ref: 'Luke 17:11-19', resume: 'Ten lepers are healed but only one — a Samaritan — returns to thank Jesus.', quote: 'Were there not ten cleansed? But where are the nine?', quoteRef: 'Luke 17:17', book: 42, chapter: 17, startVerse: 11, endVerse: 19 },
    { titre: 'The Woman with the Issue of Blood', theme: 'Faith that Touches', ref: 'Mark 5:25-34', resume: 'A woman sick for twelve years touches the hem of Jesus\'s garment and is instantly healed.', quote: 'Daughter, thy faith hath made thee whole; go in peace.', quoteRef: 'Mark 5:34', book: 41, chapter: 5, startVerse: 25, endVerse: 34 },
    { titre: 'Raising Jairus\'s Daughter', theme: 'The Child is not Dead, but Asleep', ref: 'Mark 5:21-43', resume: 'The synagogue ruler\'s daughter dies. Jesus takes her hand and says: Talitha cumi.', quote: 'Talitha cumi — Damsel, I say unto thee, arise.', quoteRef: 'Mark 5:41', book: 41, chapter: 5, startVerse: 21, endVerse: 43 },
    { titre: 'Healing the Deaf-Mute', theme: 'Ephphatha — Be Opened', ref: 'Mark 7:31-37', resume: 'Jesus puts his fingers into the ears of a deaf-mute man and says Ephphatha, and his tongue is loosed.', quote: 'Ephphatha, that is, Be opened.', quoteRef: 'Mark 7:34', book: 41, chapter: 7, startVerse: 31, endVerse: 37 },
    { titre: 'The Man with the Withered Hand', theme: 'Healing on the Sabbath', ref: 'Mark 3:1-6', resume: 'Jesus heals a man on the sabbath, challenging the Pharisees. Is it lawful to do good on the sabbath?', quote: 'Stretch forth thine hand.', quoteRef: 'Mark 3:5', book: 41, chapter: 3, startVerse: 1, endVerse: 6 },
    { titre: 'The Miraculous Catch of Fish', theme: 'Abundance and Calling', ref: 'Luke 5:1-11', resume: 'After a fruitless night, Peter casts the net at Jesus\'s word and hauls in an astonishing catch.', quote: 'From henceforth thou shalt catch men.', quoteRef: 'Luke 5:10', book: 42, chapter: 5, startVerse: 1, endVerse: 11 },
    { titre: 'Jesus Casts out an Unclean Spirit', theme: 'Authority over Spirits', ref: 'Mark 1:21-28', resume: 'At the Capernaum synagogue, Jesus commands an unclean spirit to come out. It obeys.', quote: 'Hold thy peace, and come out of him.', quoteRef: 'Mark 1:25', book: 41, chapter: 1, startVerse: 21, endVerse: 28 },
    { titre: 'Healing Peter\'s Mother-in-Law', theme: 'Power that Restores', ref: 'Mark 1:29-31', resume: 'Jesus takes the hand of Peter\'s feverish mother-in-law and the fever leaves her immediately.', quote: 'The fever left her, and she ministered unto them.', quoteRef: 'Mark 1:31', book: 41, chapter: 1, startVerse: 29, endVerse: 31 },
    { titre: 'Healing the Centurion\'s Servant', theme: 'Faith that Amazes', ref: 'Matthew 8:5-13', resume: 'A centurion asks Jesus to heal his servant from a distance. His faith amazes Jesus himself.', quote: 'I have not found so great faith, no, not in Israel.', quoteRef: 'Mt 8:10', book: 40, chapter: 8, startVerse: 5, endVerse: 13 },
    { titre: 'Raising the Widow\'s Son', theme: 'The Compassion of Jesus', ref: 'Luke 7:11-17', resume: 'At Nain, Jesus touches the coffin of a widow\'s only son and calls him back to life.', quote: 'Young man, I say unto thee, Arise.', quoteRef: 'Luke 7:14', book: 42, chapter: 7, startVerse: 11, endVerse: 17 },
    { titre: 'Healing the Man with Dropsy', theme: 'Mercy without Borders', ref: 'Luke 14:1-6', resume: 'Jesus heals a man with dropsy on the sabbath, at the house of a leading Pharisee.', quote: 'Is it lawful to heal on the sabbath day?', quoteRef: 'Luke 14:3', book: 42, chapter: 14, startVerse: 1, endVerse: 6 },
    { titre: 'The Second Miraculous Catch of Fish', theme: 'Restoration & Mission', ref: 'John 21:1-14', resume: 'After the resurrection, Jesus appears by the lake. At his word, the net fills with 153 large fish.', quote: 'Cast the net on the right side of the ship, and ye shall find.', quoteRef: 'John 21:6', book: 43, chapter: 21, startVerse: 1, endVerse: 14 },
    { titre: 'Healing the Nobleman\'s Son', theme: 'A Word that Heals at a Distance', ref: 'John 4:46-54', resume: 'A royal official begs Jesus to heal his dying son. Jesus speaks one word — and the child lives.', quote: 'Go thy way; thy son liveth.', quoteRef: 'John 4:50', book: 43, chapter: 4, startVerse: 46, endVerse: 54 },
  ],
  mg: [
    { titre: 'Ny Fanambadian\'i Kana', theme: 'Voninahitra Nasehona', ref: 'Jaona 2:1-11', resume: 'Novain\'i Jesoa ho divay ny rano tamin\'ny fety fanambadiana. Izay ny famantarana voalohany.', quote: 'Nasehony ny voninahiny; ary ny mpianany nino Azy.', quoteRef: 'Jao 2:11', book: 43, chapter: 2, startVerse: 1, endVerse: 11 },
    { titre: 'Ny Fiampangana ny Rivotra', theme: 'Tompon\'ny Aeolika', ref: 'Marka 4:35-41', resume: 'Nodidiain\'i Jesoa ny rivotra sy ny ranomasina, dia nisy fandriampahalemana lehibe.', quote: 'Mangina! Mitsahara!', quoteRef: 'Mar 4:39', book: 41, chapter: 4, startVerse: 35, endVerse: 41 },
    { titre: 'Ny Fandehanana Ambony Rano', theme: 'Finoana & Fisalasalana', ref: 'Matio 14:22-33', resume: 'Nandeha tamin\'ny ranomasina i Jesoa. Piera niezaka nanaraka fa niditra anaty fisalasalana.', quote: 'Ry kely finoana, nahoana no nisalasala ianao?', quoteRef: 'Mat 14:31', book: 40, chapter: 14, startVerse: 22, endVerse: 33 },
    { titre: 'Ny Fampitomboana ny Mofo', theme: 'Fikarakarana Andriamanitra', ref: 'Jaona 6:1-15', resume: 'Tamin\'ny mofo dimy sy hazandrano roa, noferin\'i Jesoa ny lehilahy dimy arivo ka niangon\'ny sobika roa ambin\'ny folo sisa.', quote: 'Angony ny sombiny sisa, mba tsy hisy ho very.', quoteRef: 'Jao 6:12', book: 43, chapter: 6, startVerse: 1, endVerse: 15 },
    { titre: 'Ny Fananganana an\'i Lazara', theme: 'Izaho no Fananganana', ref: 'Jaona 11:1-45', resume: 'I Lazara efa maty efa andro efatra. I Jesoa nitomany, dia niantso mafy, ary nivoaka avy tao am-pasana i Lazara.', quote: 'Izaho no fananganana ny maty sy ny fiainana; izay mino Ahy dia ho velona.', quoteRef: 'Jao 11:25', book: 43, chapter: 11, startVerse: 1, endVerse: 45 },
    { titre: 'Ny Fanasitranana ny Jamba Teraka', theme: 'Izaho no Fahazavan\'izao Tontolo izao', ref: 'Jaona 9:1-41', resume: 'I Jesoa nanao fotaka ary nampihatra izany tamin\'ny mason\'ny lehilahy jamba teraka.', quote: 'Izaho no fahazavan\'izao tontolo izao.', quoteRef: 'Jao 9:5', book: 43, chapter: 9, startVerse: 1, endVerse: 41 },
    { titre: 'Ny Fanasitranana ny Malemy Tongotra', theme: 'Fahefana hamela Heloka', ref: 'Marka 2:1-12', resume: 'Lehilahy efatra namaky ny tafo nampidina ny namandriny malemy tongotra teo anatrehan\'i Jesoa.', quote: 'Mitsangana, ento ny fandrianao, ka mandehana.', quoteRef: 'Mar 2:11', book: 41, chapter: 2, startVerse: 1, endVerse: 12 },
    { titre: 'Ny Fanasitranana ny Boka Folo', theme: 'Fisaorana & Finoana', ref: 'Lioka 17:11-19', resume: 'Boka folo nositranina fa ny anankiray ihany — Samaritana — niverina nisaotra an\'i Jesoa.', quote: 'Tsy ny folo va no nahadiovan\'izany? Fa aiza ny sivy?', quoteRef: 'Lio 17:17', book: 42, chapter: 17, startVerse: 11, endVerse: 19 },
    { titre: 'Ny Vehivavy Nandeha Ra', theme: 'Finoana Manendry', ref: 'Marka 5:25-34', resume: 'Vehivavy narary roa ambin\'ny folo taona nanendry ny fitafian\'i Jesoa ary nositranina niaraka tamin\'izay.', quote: 'Zanako, ny finoanao no nahavonjy anao; mandehana soa aman-tsara.', quoteRef: 'Mar 5:34', book: 41, chapter: 5, startVerse: 25, endVerse: 34 },
    { titre: 'Ny Fananganana ny Zanakavavin\'i Jairo', theme: 'Tidory Fotsiny ny Zazavavy', ref: 'Marka 5:21-43', resume: 'Ny zanakavavin\'ny lohandohan\'ny synagoga maty. Ny tanan\'i Jesoa nihazona azy sy nilaza: Talita kouma.', quote: 'Talita kouma — Zazavavy, hoy Izaho aminao, mitsangana.', quoteRef: 'Mar 5:41', book: 41, chapter: 5, startVerse: 21, endVerse: 43 },
    { titre: 'Ny Fanasitranana ny Moana sy Marenina', theme: 'Efata — Mivelà', ref: 'Marka 7:31-37', resume: 'I Jesoa nampiditra ny rantsan-tànany tao an\'sofin\'ny lehilahy marenina ary nanao hoe Efata, dia nibakotra ny lelany.', quote: 'Efata, dia hoe: Mivelà.', quoteRef: 'Mar 7:34', book: 41, chapter: 7, startVerse: 31, endVerse: 37 },
    { titre: 'Ny Lehilahy Maina ny Tànany', theme: 'Fanasitranana Andro Sabata', ref: 'Marka 3:1-6', resume: 'I Jesoa nanasitrana ny lehilahy tamin\'ny andro sabata, nanohitra ny Fariseo. Mba azo atao ve ny manao soa amin\'ny sabata?', quote: 'Ahinjiro ny tananao.', quoteRef: 'Mar 3:5', book: 41, chapter: 3, startVerse: 1, endVerse: 6 },
    { titre: 'Ny Haza Mahagaga', theme: 'Fahabetsahana sy Antso', ref: 'Lioka 5:1-11', resume: 'Nony alina fa tsy nisy azony, nanipy ny harato i Piera tamin\'ny teny fikasan\'i Jesoa ka nahazo be dia be.', quote: 'Hatramin\'izao dia olona no hazoina.', quoteRef: 'Lio 5:10', book: 42, chapter: 5, startVerse: 1, endVerse: 11 },
    { titre: 'I Jesoa Namoaka Fanahy Maloto', theme: 'Fahefana amin\'ny Fanahy', ref: 'Marka 1:21-28', resume: 'Tao amin\'ny synagogan\'i Kapernaomy, nodidian\'i Jesoa ny fanahy maloto hivoaka. Nanaiky izy.', quote: 'Mangina, mivoaha amin\'ity lehilahy ity.', quoteRef: 'Mar 1:25', book: 41, chapter: 1, startVerse: 21, endVerse: 28 },
    { titre: 'Ny Fanasitranana ny Rafozavan\'i Piera', theme: 'Hery Manafahana', ref: 'Marka 1:29-31', resume: 'I Jesoa nihazona ny tanàn\'ny rafozavan\'i Piera izay nanana tazo ary niala niaraka tamin\'izay ny tazo.', quote: 'Niala tamin\'ny tazo izy, dia nanompo azy ireo.', quoteRef: 'Mar 1:31', book: 41, chapter: 1, startVerse: 29, endVerse: 31 },
    { titre: 'Ny Fanasitranana ny Mpanompon\'ny Kapiteny', theme: 'Finoana Mahagaga', ref: 'Matio 8:5-13', resume: 'Kapiteny nangataka an\'i Jesoa hanasitrana ny mpanompony tsy nanatrika. Ny finoany nahagaga an\'i Jesoa.', quote: 'Tsy hitan\'aho finoana lehibe toy izany, na dia tao amin\'ny Isiraely aza.', quoteRef: 'Mat 8:10', book: 40, chapter: 8, startVerse: 5, endVerse: 13 },
    { titre: 'Ny Fananganana ny Zanakalahin\'ny Mpitondratena', theme: 'Fitiavan\'i Jesoa', ref: 'Lioka 7:11-17', resume: 'Tao Naïna, i Jesoa nanendry ny tranokapoka ny zanakalahin\'ny mpitondratena tokana ary namerina azy ho velona.', quote: 'Ry tovolahy, hoy Izaho aminao: Mitsangana.', quoteRef: 'Lio 7:14', book: 42, chapter: 7, startVerse: 11, endVerse: 17 },
    { titre: 'Ny Fanasitranana ny Lehilahy Miandry', theme: 'Famindrampo Tsy Misy Fetra', ref: 'Lioka 14:1-6', resume: 'I Jesoa nanasitrana lehilahy tamin\'ny andro sabata, tao an\'tranon\'ny loharan\'ny Fariseo.', quote: 'Mba azo atao va ny manasitrana amin\'ny sabata?', quoteRef: 'Lio 14:3', book: 42, chapter: 14, startVerse: 1, endVerse: 6 },
    { titre: 'Ny Haza Mahagaga Faharoa', theme: 'Fananganana & Iraka', ref: 'Jaona 21:1-14', resume: 'Taorian\'ny fitsanganan\'i Jesoa tamin\'ny maty, niseho teny amoron\'ny farihy Izy. Tamin\'ny teniny, ny harato feno hazandrano 153 lehibe.', quote: 'Anipy ny harato eo amin\'ny ankavanan\'ny sambo, dia hahita.', quoteRef: 'Jao 21:6', book: 43, chapter: 21, startVerse: 1, endVerse: 14 },
    { titre: 'Ny Fanasitranana ny Zanaky ny Manan-karena', theme: 'Teny Manasitrana Lavitra', ref: 'Jaona 4:46-54', resume: 'Mpanapaka nangataka an\'i Jesoa hanasitrana ny zanany marary ho faty. I Jesoa niteny teny iray — ary velona ny zazalahy.', quote: 'Mandehana; ny zanakao velona.', quoteRef: 'Jao 4:50', book: 43, chapter: 4, startVerse: 46, endVerse: 54 },
  ],
};

type VerseData = {
  ref: string;
  text: string;
  book: number;
  chapter: number;
  verse: number;
};

type PassageData = {
  titre: string;
  theme: string;
  ref: string;
  resume: string;
  quote: string;
  quoteRef: string;
  book: number;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

type Translations = typeof T['fr'];

type CardData =
  | { type: 'verse'; data: VerseData }
  | { type: 'parabole'; data: PassageData }
  | { type: 'miracle'; data: PassageData }
  | { type: 'favori'; data: Favorite };

function getRandomVerseIndex(lang: 'fr' | 'en' | 'mg') {
  return Math.floor(Math.random() * VERSE_DU_JOUR[lang].length);
}

function Rule({ color = '#8B654060' }: { color?: string }) {
  return <View style={[styles.rule, { borderColor: color }]} />;
}

function Dropcap({ letter, color }: { letter: string; color: string }) {
  return (
    <View style={[styles.dropcap, { borderColor: color + '55' }]}>
      <Text style={[styles.dropcapLetter, { color }]}>{letter}</Text>
    </View>
  );
}

function VerseCard({ data, t, onRead }: { data: VerseData; t: Translations; onRead: () => void }) {
  const firstLetter = data.text[0];
  const rest = data.text.slice(1);

  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.verseCardBox}>
        <View style={styles.verseIconCircle}>
          <Ionicons name="book-outline" size={30} color={P.rubriq} />
        </View>

        <Text style={[styles.categoryTag, { color: P.rubriq }]}>{t.verseTag}</Text>
        <Text style={styles.verseTodaySub}>{t.meditation}</Text>

        <Rule />

        <View style={styles.verseBodyRow}>
          <Dropcap letter={firstLetter} color={P.rubriq} />
          <Text style={styles.verseBodyText}>{rest}</Text>
        </View>

        <Rule />

        <Text style={styles.verseRef}>{data.ref}</Text>

        <TouchableOpacity onPress={onRead} activeOpacity={0.75} style={styles.verseMainButton}>
          <Text style={styles.verseMainButtonText}>{t.lirePassage}</Text>
          <Ionicons name="arrow-forward" size={15} color={P.parchmentLt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PassageCard({
  data,
  onRead,
  t,
  type,
}: {
  data: PassageData;
  onRead: () => void;
  t: Translations;
  type: 'parabole' | 'miracle';
}) {
  const color = type === 'parabole' ? P.verdeGris : P.azur;
  const tag = type === 'parabole' ? t.parabolTag : t.miracleTag;

  return (
    <View style={[styles.card, { backgroundColor: P.parchment }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color }]}>{tag}</Text>
        <Rule color={P.sepia + '50'} />

        <Text style={[styles.themeLabel, { color: color + 'BB' }]}>
          {data.theme.toUpperCase()}
        </Text>

        <Text style={styles.passageTitle}>{data.titre}</Text>
        <Text style={[styles.passageRef, { color }]}>{data.ref}</Text>

        <View style={[styles.marginNote, { borderLeftColor: color + '60' }]}>
          <Text style={styles.marginText}>{data.resume}</Text>
        </View>

        <View style={[styles.quoteBlock, { borderColor: color + '40', backgroundColor: color + '08' }]}>
          <Text style={[styles.quoteMarks, { color: color + '60' }]}>"</Text>
          <Text style={styles.quoteText}>{data.quote}</Text>
          <Text style={[styles.quoteRef, { color }]}>{data.quoteRef}</Text>
        </View>

        <Rule color={P.sepia + '40'} />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color }]}>{t.lirePassage}</Text>
          <Ionicons name="arrow-forward" size={12} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FavoriCard({ data, onRead, t }: { data: Favorite; onRead: () => void; t: Translations }) {
  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.rubriqLt }]}>{t.favoriTag}</Text>
        <Rule />

        <Text style={[styles.passageTitle, { fontWeight: '400', fontSize: 16 }]}>
          {data.bookName} {data.chapter}:{data.verse}
        </Text>

        <Text style={[styles.verseBodyText, { fontSize: 17, lineHeight: 28 }]}>
          {data.text}
        </Text>

        <Rule />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color: P.rubriqLt }]}>{t.lireChapter}</Text>
          <Ionicons name="arrow-forward" size={12} color={P.rubriqLt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccueilScreen() {
  const { lang } = useBible();
  const t = T[lang];
  const router = useRouter();
  const navigation = useNavigation<any>();

  const [lastPos, setLastPos] = useState<LastPosition | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [verseIndex, setVerseIndex] = useState(() => getRandomVerseIndex(lang));
  const [refreshingVisual, setRefreshingVisual] = useState(false);

  const listRef = useRef<FlatList<CardData>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loaderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setVerseIndex(getRandomVerseIndex(lang));
  }, [lang]);

  const verseOfDay = useMemo(() => {
    return VERSE_DU_JOUR[lang][verseIndex % VERSE_DU_JOUR[lang].length];
  }, [lang, verseIndex]);

  const baseCards: CardData[] = useMemo(() => {
    const feed: CardData[] = [];

    feed.push({ type: 'verse', data: verseOfDay });

    const paraboles = PARABOLES[lang];
    const miracles = MIRACLES[lang];
    const maxItems = Math.max(paraboles.length, miracles.length);

    for (let i = 0; i < maxItems; i++) {
      if (i < paraboles.length) feed.push({ type: 'parabole', data: paraboles[i] });
      if (i < miracles.length) feed.push({ type: 'miracle', data: miracles[i] });
    }

    return feed;
  }, [verseOfDay, lang]);

  const LOOP_OFFSET = baseCards.length;

  const cards = useMemo(() => {
    return [...baseCards, ...baseCards, ...baseCards];
  }, [baseCards]);

  const refreshAccueil = useCallback(
    (changeVerse = false) => {
      loadLastPosition().then(setLastPos);
      loadFavorites().then(setFavorites);

      if (changeVerse) {
        setVerseIndex(getRandomVerseIndex(lang));
      }

      if (LOOP_OFFSET > 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: LOOP_OFFSET,
            animated: false,
          });
        }, 100);
      }
    },
    [LOOP_OFFSET, lang]
  );

  const animateRefresh = useCallback(() => {
    setRefreshingVisual(true);

    loaderAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.35,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(loaderAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRefreshingVisual(false);
    });

    refreshAccueil(true);
  }, [fadeAnim, loaderAnim, refreshAccueil]);

  useFocusEffect(
    useCallback(() => {
      loadLastPosition().then(setLastPos);
      loadFavorites().then(setFavorites);
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      animateRefresh();
    });

    return unsubscribe;
  }, [navigation, animateRefresh]);

  const onLayout = useCallback(() => {
    if (LOOP_OFFSET > 0) {
      listRef.current?.scrollToIndex({
        index: LOOP_OFFSET,
        animated: false,
      });
    }
  }, [LOOP_OFFSET]);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const index = Math.round(e.nativeEvent.contentOffset.y / CARD_HEIGHT);

      if (index <= 2) {
        listRef.current?.scrollToIndex({
          index: index + LOOP_OFFSET,
          animated: false,
        });
      } else if (index >= cards.length - 3) {
        listRef.current?.scrollToIndex({
          index: index - LOOP_OFFSET,
          animated: false,
        });
      }
    },
    [cards.length, LOOP_OFFSET]
  );

  const goToPassage = (
    book: number,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: {
        livre: String(book),
        chapitre: String(chapter),
        ...(startVerse ? { start: String(startVerse) } : {}),
        ...(endVerse ? { end: String(endVerse) } : {}),
      },
    });
  };

  const renderCard = ({ item }: { item: CardData }) => {
    switch (item.type) {
      case 'verse':
        return (
          <VerseCard
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.verse,
                item.data.verse
              )
            }
          />
        );

      case 'parabole':
        return (
          <PassageCard
            type="parabole"
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.startVerse,
                item.data.endVerse
              )
            }
          />
        );

      case 'miracle':
        return (
          <PassageCard
            type="miracle"
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.startVerse,
                item.data.endVerse
              )
            }
          />
        );

      case 'favori':
        return (
          <FavoriCard
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.verse,
                item.data.verse
              )
            }
          />
        );
    }
  };

  const spin = loaderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.parchmentDk} />

      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/parametres')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={15} color={P.parchmentLt} />
            <Text style={styles.btnPrimaryText}>{t.parametres}</Text>
          </TouchableOpacity>

          {lastPos ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => goToPassage(lastPos.book, lastPos.chapter)}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText} numberOfLines={1}>
                {t.reprendre} · {lastPos.bookName} {lastPos.chapter}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push('/(tabs)/livres')}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText}>{t.lireBible}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.swipeHint}>{t.swipeHint}</Text>
      </View>

      {refreshingVisual && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.refreshBadge,
            {
              opacity: loaderAnim,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="refresh" size={22} color={P.rubriq} />
        </Animated.View>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          ref={listRef}
          data={cards}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderCard}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={CARD_HEIGHT}
          decelerationRate="fast"
          onLayout={onLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.parchment,
  },

  refreshBadge: {
    position: 'absolute',
    top: TOPBAR_HEIGHT + 14,
    alignSelf: 'center',
    zIndex: 50,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF8EC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654055',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  topBar: {
    height: TOPBAR_HEIGHT,
    backgroundColor: P.parchmentDk,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8B654070',
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    gap: 10,
  },

  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: P.ink,
    borderRadius: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  btnPrimaryText: {
    color: P.parchmentLt,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654090',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  btnSecondaryText: {
    textAlign: 'center',
    color: P.inkLight,
    fontSize: 13,
    fontWeight: '500',
  },

  swipeHint: {
    fontSize: 10,
    color: P.inkFaint,
    textAlign: 'center',
    letterSpacing: 0.8,
  },

  card: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pageEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 22,
  },

  pageEdgeLeft: {
    left: 0,
  },

  pageEdgeRight: {
    right: 0,
  },

  cardInner: {
    width: SCREEN_WIDTH - 72,
    alignItems: 'stretch',
  },

  verseCardBox: {
    width: SCREEN_WIDTH - 58,
    minHeight: CARD_HEIGHT * 0.72,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  verseIconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#7A201055',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: '#F5EDD8',
  },

  verseTodaySub: {
    textAlign: 'center',
    color: P.inkFaint,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 8,
  },

  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },

  rule: {
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },

  dropcap: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },

  dropcapLetter: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 34,
  },

  verseBodyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  verseBodyText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 30,
    color: P.ink,
    fontStyle: 'italic',
    letterSpacing: 0.15,
  },

  verseRef: {
    fontSize: 12,
    color: P.sepia,
    textAlign: 'right',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },

  verseMainButton: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.rubriq,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },

  verseMainButtonText: {
    color: P.parchmentLt,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  themeLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: P.inkFaint,
    textAlign: 'center',
    marginBottom: 6,
  },

  passageTitle: {
    fontSize: 21,
    fontWeight: '300',
    color: P.ink,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  passageRef: {
    fontSize: 10,
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 22,
  },

  marginNote: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    marginBottom: 12,
  },

  marginText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
    color: P.inkLight,
  },

  quoteBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 4,
  },

  quoteMarks: {
    fontSize: 32,
    lineHeight: 28,
    fontWeight: '300',
    marginBottom: 2,
  },

  quoteText: {
    fontSize: 14,
    lineHeight: 23,
    fontStyle: 'italic',
    color: P.ink,
    marginBottom: 8,
  },

  quoteRef: {
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: 'right',
    textTransform: 'uppercase',
  },

  lireLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 2,
  },

  lireLinkText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});