// app/(tabs)/livres.tsx
import {
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { getBooks } from '../../services/bibleService';
import { useMemo, useState, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Remplace ici par ton BOOK_IMAGES complet
const BOOK_IMAGES: Record<number, any> = {
  1: { uri: 'https://tse1.explicit.bing.net/th/id/OIP.9Af5USctE0xJ_6Z9KaYUZgHaFb?w=1200&h=880&rs=1&pid=ImgDetMain&o=7&rm=3' },
  2: { uri: 'https://media.bible.art/468e644d-9954-4f72-91c1-9993635beb2d-compressed.jpg' },
  3: { uri: 'https://www.shutterstock.com/image-photo/close-image-elijah-bringing-fire-600nw-2598540401.jpg' },
  4: { uri: 'https://img.freepik.com/premium-photo/exodus-bible-moses-crossing-desert-with-israelites_740566-5229.jpg' },
  5: { uri: 'https://th.bing.com/th/id/R.7d3e77a6a74e2361b3e31f7875fb8289?rik=1ITyd3x0j3KQ4A&riu=http%3a%2f%2fjudaicapedia.org%2fwp-content%2fuploads%2f2023%2f07%2fAdobeStock_612409895-scaled.jpeg&ehk=w%2bFfDH7bhvgBiYDfhzHo3Fvf0SZk6%2boHwr8X68iBIAI%3d&risl=&pid=ImgRaw&r=0' },
  6: { uri: 'https://d3owcl6pd5zkqc.cloudfront.net/images/Joshua/Joshua.webp' },
  7: { uri: 'https://media.bible.art/d1241ce4-8111-4ce8-bce0-bb2f52886832-compressed.jpg' },
  8: { uri: 'https://i.pinimg.com/originals/88/cc/40/88cc40b4f1e4f966c082a6b6aad3e2ed.jpg' },
  9: { uri: 'https://media.bible.art/b5781108-dd99-4d1a-99e0-897ece587783-compressed.jpg' },
  10: { uri: 'https://img.freepik.com/fotos-premium/realistisches-bild-biblische-figur-koenig-saul-in-der-burg_968799-928.jpg' },
  11: { uri: 'https://tse4.mm.bing.net/th/id/OIP.CKkD52Y68kEvA6UCIss2SwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  12: { uri: 'https://media.bible.art/0257ed57-fa6a-4793-9273-a62565fbb294-thumbnail.jpg' },
  13: { uri: 'https://preview.redd.it/gods-breath-of-life-v0-9wcqbsbqvtzb1.jpg?auto=webp&s=75e9da5f4b9ba49031445c5c664349295df8ed69' },
  14: { uri: 'https://tse2.mm.bing.net/th/id/OIP.ACWFpgkF-csIQZxcOgSiAgHaHa?w=1080&h=1080&rs=1&pid=ImgDetMain&o=7&rm=3' },
  15: { uri: 'https://www.estanabiblia.com.br/wp-content/uploads/2024/12/esdras-5-a-retomada-da-construcao-do-templo-1024x585.jpg' },
  16: { uri: 'https://tse2.mm.bing.net/th/id/OIP.3B4tjj-WDXdahZ-431d1dwHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3' },
  17: { uri: 'https://wol.jw.org/fr/wol/mp/r30/lp-f/lfb/2017/648' },
  18: { uri: 'https://i.pinimg.com/736x/82/a4/d4/82a4d463c2f74eaaabe4e566733ffe49.jpg' },
  19: { uri: 'https://media.bible.art/65df42c7-3ab5-4470-9694-6d66abdb52b2-compressed.jpg' },
  20: { uri: 'https://i.pinimg.com/1200x/64/b7/f7/64b7f7f01c5ad3608ab9f28900b510a0.jpg' },
  21: { uri: 'https://images.nightcafe.studio/jobs/ddqBALEts2N9Lixtob7M/ddqBALEts2N9Lixtob7M--0--qo1mo.jpg?tr=w-1600,c-at_max' },
  22: { uri: 'https://faithpot.b-cdn.net/wp-content/uploads/2024/11/wedding-traditions-bible-770x404.jpg' },
  23: { uri: 'https://wol.jw.org/ssp/wol/mp/r388/lp-lse/mwb21/2021/720' },
  24: { uri: 'https://i.pinimg.com/736x/e5/31/a3/e531a3319b9e887009104f9902ff5e38--le-proph%C3%A8te-book-images.jpg' },
  25: { uri: 'https://i.pinimg.com/736x/27/45/b0/2745b0776cd65b1b87cf7519741ef0c2.jpg' },
  26: { uri: 'https://d3owcl6pd5zkqc.cloudfront.net/images/Ezekiel/Ezekiel_6_1200x1200.webp' },
  27: { uri: 'https://www.gracefilledpathways.com/wp-content/uploads/2023/10/DALL%C2%B7E-2024-04-15-13.19.08-Create-a-powerful-and-inspiring-image-for-Daniel_-Faith-in-the-Lions-Den.-The-image-should-portray-Daniel-inside-the-lions-den-standing-calmly-wi.webp' },
  28: { uri: 'https://i.pinimg.com/736x/12/75/42/12754276fb821720adc169ea2a64b7fb.jpg' },
  29: { uri: 'https://www.learnreligions.com/thmb/jPu5s-SgL5lUr98StwwKI2utUuo=/2121x1414/filters:fill(auto,1)/BookofJoel-743694041-588ab8d6a01c497190fa2c721a48cad8.jpg' },
  30: { uri: 'https://d3owcl6pd5zkqc.cloudfront.net/images/Amos/Amos_5.webp' },
  31: { uri: 'https://tse1.mm.bing.net/th/id/OIP.HCuT8dWpxNNvqtPYunjWvgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  32: { uri: 'https://tse3.mm.bing.net/th/id/OIP.S1kExOoHYlkiYk74eCmynwHaFr?rs=1&pid=ImgDetMain&o=7&rm=3' },
  33: { uri: 'https://i.pinimg.com/736x/b8/35/4e/b8354eca3e98d0851151c8382636d36f.jpg' },
  34: { uri: 'https://tse3.mm.bing.net/th/id/OIP.mUMgnwi7mndV4n00WU9bmwHaFj?rs=1&pid=ImgDetMain&o=7&rm=3' },
  35: { uri: 'https://i.pinimg.com/736x/7c/19/da/7c19dac1dbe1a386ca3d0f6613831667.jpg' },
  36: { uri: 'https://i.pinimg.com/736x/5e/ba/5d/5eba5d7e72af69af057b406d1920d681.jpg' },
  37: { uri: 'https://media.bible.art/76410fb4-2e43-4eea-bee3-c74e11ab1c1c-compressed.jpg' },
  38: { uri: 'https://www.biblespoir.com/wp-content/uploads/2023/02/Zacharie-450x450.jpg' },
  39: { uri: 'https://assets.churchofjesuschrist.org/053a47b41c9b56d4a95fd51705d5bd0b3aea5c47' },
  40: { uri: 'https://i.pinimg.com/736x/11/ff/d2/11ffd2b654f1646dad70ce8769b64b70.jpg' },
  41: { uri: 'https://i.pinimg.com/736x/0c/d1/d9/0cd1d9ed7de34ee1789fb30af4c7ccff.jpg' },
  42: { uri: 'https://i.pinimg.com/736x/47/62/c8/4762c894ef801b70c02952b12faded9c.jpg' },
  43: { uri: 'https://i.pinimg.com/736x/42/24/cb/4224cba7ef46c761f2642d85f5ffdcab.jpg' },
  44: { uri: 'https://tse3.mm.bing.net/th/id/OIP.lCb5RoRpKuvTGCAZCbesuAHaE7?rs=1&pid=ImgDetMain&o=7&rm=3' },
  45: { uri: 'https://i.pinimg.com/1200x/e6/84/57/e68457a9e30a6a212b0a23eddc7d2df7.jpg' },
  46: { uri: 'https://i.pinimg.com/736x/ae/e1/52/aee152656a51a574af419adca0b02567.jpg' },
  47: { uri: 'https://i.pinimg.com/736x/ff/2b/aa/ff2baaee48b0dd830e480648a349aeab.jpg' },
  48: { uri: 'https://i.pinimg.com/736x/4e/7b/7a/4e7b7ae81517167ff7937d72a0dfc0d4.jpg' },
  49: { uri: 'https://tse2.mm.bing.net/th/id/OIP.UDKpvXiNIHqEoZWZAvtlowHaHa?w=1024&h=1024&rs=1&pid=ImgDetMain&o=7&rm=3' },
  50: { uri: 'https://i.pinimg.com/236x/e5/67/62/e5676227898b1848801893fb4e64b591--small-rooms-sau.jpg' },
  51: { uri: 'https://i.pinimg.com/736x/d8/07/12/d807126e15224660ec46c598cdff9862.jpg' },
  52: { uri: 'https://i.pinimg.com/736x/b0/1d/16/b01d1600319af68bd0c4471b0b7bce92.jpg' },
  53: { uri: 'https://i.pinimg.com/736x/6d/84/1a/6d841a5bbd25e5e0a20b6eba6c84bc07.jpg' },
  54: { uri: 'https://tse3.mm.bing.net/th/id/OIP.Nanx6yQ14dnzKWPPfaGafAHaHa?w=736&h=736&rs=1&pid=ImgDetMain&o=7&rm=3' },
  55: { uri: 'https://tse1.explicit.bing.net/th/id/OIP.tCkq5NUyXf9ws2sJr1oX8gHaHa?w=600&h=600&rs=1&pid=ImgDetMain&o=7&rm=3' },
  56: { uri: 'https://i.pinimg.com/1200x/df/ea/47/dfea4769dd1b45373de77ece51132496.jpg' },
  57: { uri: 'https://i.pinimg.com/1200x/9f/9e/ad/9f9ead991e1ee6cb704db2687091dc62.jpg' },
  58: { uri: 'https://tse3.mm.bing.net/th/id/OIP.WnFVMKxsM9IRvx_h4m5KZQHaHa?w=736&h=736&rs=1&pid=ImgDetMain&o=7&rm=3' },
  59: { uri: 'https://i.pinimg.com/1200x/b4/3a/18/b43a18f26a73624de73d2cd72e1e7154.jpg' },
  60: { uri: 'https://i.pinimg.com/736x/f8/b1/58/f8b1587244d312ac694765aa6417e2a0.jpg' },
  61: { uri: 'https://i.pinimg.com/736x/93/1e/8c/931e8c5e4f5d1e2cb4b191f23b020b49.jpg' },
  62: { uri: 'https://i.pinimg.com/1200x/5f/0d/a3/5f0da3b28cff58feaede64d7cfcdf4fb.jpg' },
  63: { uri: 'https://i.pinimg.com/736x/6b/19/0f/6b190fb516b3bf87bee0325480cc011a.jpg' },
  64: { uri: 'https://i.pinimg.com/736x/1b/4f/59/1b4f598808773d8f3acf9846f9ac99e7.jpg' },
  65: { uri: 'https://th.bing.com/th/id/R.5bab356dc04aef219514c4eebd114e9b?rik=i24u8jrukZyGuw&riu=http%3a%2f%2fpredications.p.r.pic.centerblog.net%2fdcccd3cd.jpg&ehk=xjOINy8THSeB8ftbFz2QetUbgXURZlhBOB4FFz0XN2g%3d&risl=&pid=ImgRaw&r=0' },
  66: { uri: 'https://i.pinimg.com/736x/06/aa/b0/06aab09cfa28f8be457f74f8e85dd5ae.jpg' },
};

const BOOK_SUMMARIES: Record<number, { fr: string; en: string }> = {
  // ── PENTATEUQUE ─────────────────────────────────────────────────────────────
  1:  { fr: 'La création du monde et l\'histoire des patriarches.', en: 'Creation, the fall, and the patriarchs.' },
  2:  { fr: 'La libération d\'Israël hors d\'Égypte et la loi de Dieu.', en: 'Israel\'s deliverance from Egypt and the covenant at Sinai.' },
  3:  { fr: 'Les lois de sainteté, de sacrifice et de pureté.', en: 'Laws of holiness, sacrifice, and purity.' },
  4:  { fr: 'Le voyage d\'Israël dans le désert et ses rébellions.', en: 'Israel\'s wanderings in the wilderness.' },
  5:  { fr: 'Le discours d\'adieu de Moïse avant l\'entrée en Canaan.', en: 'Moses\' farewell sermons before entering the Promised Land.' },
 
  // ── LIVRES HISTORIQUES ───────────────────────────────────────────────────────
  6:  { fr: 'La conquête de Canaan sous la conduite de Josué.', en: 'The conquest of Canaan under Joshua\'s leadership.' },
  7:  { fr: 'Les juges d\'Israël dans un cycle de péché et de délivrance.', en: 'Israel\'s cycle of sin, oppression, and deliverance through the judges.' },
  8:  { fr: 'La fidélité de Ruth et sa place dans la lignée de David.', en: 'Ruth\'s faithfulness and her place in the lineage of David.' },
  9:  { fr: 'Samuel, Saül et les débuts de la monarchie en Israël.', en: 'Samuel, Saul, and the rise of Israel\'s monarchy.' },
  10: { fr: 'Le règne de David : gloire, péché et grâce de Dieu.', en: 'David\'s reign: triumph, sin, and God\'s enduring grace.' },
  11: { fr: 'De la sagesse de Salomon à la division du royaume.', en: 'Solomon\'s wisdom and the division of the kingdom.' },
  12: { fr: 'Les rois d\'Israël et de Juda jusqu\'à l\'exil babylonien.', en: 'The kings of Israel and Judah up to the Babylonian exile.' },
  13: { fr: 'L\'histoire d\'Israël depuis Adam jusqu\'à David.', en: 'Israel\'s history from Adam to David through genealogies and events.' },
  14: { fr: 'De la gloire de Salomon à la chute de Jérusalem.', en: 'From Solomon\'s glory to the fall of Jerusalem.' },
  15: { fr: 'Le retour des exilés et la reconstruction du Temple.', en: 'The return from exile and the rebuilding of the Temple.' },
  16: { fr: 'Néhémie reconstruit les murailles de Jérusalem.', en: 'Nehemiah rebuilds the walls of Jerusalem and restores the community.' },
  17: { fr: 'Esther sauve courageusement le peuple juif.', en: 'Esther courageously saves the Jewish people from destruction.' },
 
  // ── LIVRES POÉTIQUES ────────────────────────────────────────────────────────
  18: { fr: 'Job souffre injustement et rencontre Dieu dans la tempête.', en: 'Job suffers unjustly and encounters God in the whirlwind.' },
  19: { fr: 'Chants de louange, de lamentation et de confiance en Dieu.', en: 'Songs of praise, lament, and trust in God.' },
  20: { fr: 'La sagesse pratique pour une vie juste et honorable.', en: 'Practical wisdom for a righteous and honorable life.' },
  21: { fr: 'La vanité de la vie humaine sans Dieu.', en: 'The vanity of human life apart from God.' },
  22: { fr: 'Un poème d\'amour célébrant la beauté du mariage.', en: 'A poem celebrating the beauty and depth of love and marriage.' },
 
  // ── GRANDS PROPHÈTES ────────────────────────────────────────────────────────
  23: { fr: 'Jugement sur Israël et promesse du Serviteur souffrant.', en: 'Judgment on Israel and the promise of the Suffering Servant.' },
  24: { fr: 'Jérémie pleure sur Juda et annonce une nouvelle alliance.', en: 'Jeremiah mourns over Judah and announces a new covenant.' },
  25: { fr: 'Les lamentations de Jérémie sur la chute de Jérusalem.', en: 'Jeremiah\'s laments over the fall of Jerusalem.' },
  26: { fr: 'Les visions d\'Ézéchiel sur le jugement et la restauration.', en: 'Ezekiel\'s visions of judgment, exile, and Israel\'s restoration.' },
  27: { fr: 'Daniel reste fidèle à Dieu au cœur de l\'empire babylonien.', en: 'Daniel remains faithful to God in the heart of Babylon.' },
 
  // ── PETITS PROPHÈTES ────────────────────────────────────────────────────────
  28: { fr: 'L\'amour d\'Osée pour sa femme infidèle, image de Dieu et Israël.', en: 'Hosea\'s love for his unfaithful wife mirrors God\'s love for Israel.' },
  29: { fr: 'Joël annonce le Jour du Seigneur et l\'effusion de l\'Esprit.', en: 'Joel announces the Day of the Lord and the outpouring of the Spirit.' },
  30: { fr: 'Amos dénonce l\'injustice sociale et appelle à la repentance.', en: 'Amos denounces social injustice and calls Israel to repentance.' },
  31: { fr: 'Abdias prophétise le jugement d\'Édom et la restauration d\'Israël.', en: 'Obadiah prophesies judgment on Edom and restoration for Israel.' },
  32: { fr: 'Jonas fuit Dieu, puis proclame sa grâce aux nations.', en: 'Jonah flees from God, then proclaims His grace to the nations.' },
  33: { fr: 'Michée annonce le jugement et la venue du Messie à Bethléem.', en: 'Micah announces judgment and the Messiah\'s birth in Bethlehem.' },
  34: { fr: 'Nahoum proclame la chute de Ninive et la justice de Dieu.', en: 'Nahum proclaims the fall of Nineveh and God\'s justice.' },
  35: { fr: 'Habacuc questionne Dieu sur le mal et apprend à lui faire confiance.', en: 'Habakkuk questions God about evil and learns to trust His sovereignty.' },
  36: { fr: 'Sophonie annonce le Jour du Seigneur et la restauration du reste.', en: 'Zephaniah announces the Day of the Lord and the restoration of a remnant.' },
  37: { fr: 'Aggée exhorte le peuple à reconstruire le Temple de Dieu.', en: 'Haggai urges the people to rebuild God\'s Temple.' },
  38: { fr: 'Zacharie voit des visions messianiques et la gloire future.', en: 'Zechariah sees messianic visions of the coming King and future glory.' },
  39: { fr: 'Malachie appelle Israël à revenir à Dieu avant le grand Jour.', en: 'Malachi calls Israel back to God before the coming great Day.' },
 
  // ── ÉVANGILES & ACTES ───────────────────────────────────────────────────────
  40: { fr: 'Jésus, le roi Messie et l\'accomplissement de la loi.', en: 'Jesus, the Messiah King who fulfills the Law and the Prophets.' },
  41: { fr: 'Jésus, le serviteur puissant qui agit avec autorité.', en: 'Jesus, the powerful Servant who acts with authority and urgency.' },
  42: { fr: 'Jésus, le Sauveur compatissant pour tous les marginalisés.', en: 'Jesus, the compassionate Savior for the outcasts and the lost.' },
  43: { fr: 'Jésus, le Verbe de Dieu incarné qui donne la vie éternelle.', en: 'Jesus, the Word of God incarnate who gives eternal life.' },
  44: { fr: 'La naissance de l\'Église par l\'Esprit et la mission aux nations.', en: 'The birth of the Church by the Spirit and the mission to the nations.' },
 
  // ── ÉPÎTRES DE PAUL ─────────────────────────────────────────────────────────
  45: { fr: 'La justification par la foi seule, expliquée à Rome.', en: 'Justification by faith alone, explained to the church in Rome.' },
  46: { fr: 'Paul corrige les divisions et les désordres de l\'église de Corinthe.', en: 'Paul corrects divisions and disorders in the church of Corinth.' },
  47: { fr: 'Paul défend son ministère et appelle à la réconciliation.', en: 'Paul defends his ministry and calls for reconciliation.' },
  48: { fr: 'La liberté en Christ contre le légalisme des judaisants.', en: 'Freedom in Christ against the legalism of the Judaizers.' },
  49: { fr: 'L\'Église, corps du Christ, revêtue de l\'armure de Dieu.', en: 'The Church as the body of Christ, clothed in God\'s armor.' },
  50: { fr: 'La joie en Christ malgré l\'emprisonnement de Paul.', en: 'Joy in Christ despite Paul\'s imprisonment.' },
  51: { fr: 'La suprématie absolue du Christ sur toute création.', en: 'The absolute supremacy of Christ over all creation.' },
  52: { fr: 'Encouragements pour tenir ferme jusqu\'au retour du Christ.', en: 'Encouragement to stand firm until the return of Christ.' },
  53: { fr: 'Clarifications sur le Jour du Seigneur et l\'homme du péché.', en: 'Clarifications about the Day of the Lord and the man of lawlessness.' },
  54: { fr: 'Conseils à Timothée pour diriger et enseigner l\'Église.', en: 'Guidance for Timothy on leadership and sound doctrine in the Church.' },
  55: { fr: 'Le testament spirituel de Paul à son fils dans la foi.', en: 'Paul\'s spiritual testament to his son in the faith.' },
  56: { fr: 'Instructions à Tite pour établir les anciens dans les Églises.', en: 'Instructions to Titus for appointing elders and teaching sound doctrine.' },
  57: { fr: 'Paul intercède pour l\'esclave fugitif Onésime auprès de Philémon.', en: 'Paul intercedes for the runaway slave Onesimus with Philemon.' },
 
  // ── ÉPÎTRES GÉNÉRALES ───────────────────────────────────────────────────────
  58: { fr: 'La supériorité de Christ sur la loi mosaïque et les sacrifices.', en: 'The superiority of Christ over the Mosaic law and sacrifices.' },
  59: { fr: 'Une foi vivante se prouve par des œuvres et une sagesse pratique.', en: 'A living faith is proved by works and practical wisdom.' },
  60: { fr: 'Pierre encourage les croyants persécutés à tenir ferme.', en: 'Peter encourages persecuted believers to stand firm in their faith.' },
  61: { fr: 'Mise en garde contre les faux docteurs et le retour du Christ.', en: 'Warning against false teachers and the certainty of Christ\'s return.' },
  62: { fr: 'Dieu est amour : marcher dans la lumière et aimer les frères.', en: 'God is love: walking in the light and loving one another.' },
  63: { fr: 'Courte lettre appelant à rester dans la vérité de l\'Évangile.', en: 'A brief letter calling to remain in the truth of the Gospel.' },
  64: { fr: 'Encouragements à accueillir les frères itinérants dans la vérité.', en: 'Encouragement to welcome traveling ministers who serve the truth.' },
  65: { fr: 'Jude met en garde contre les faux docteurs infiltrés dans l\'Église.', en: 'Jude warns against false teachers who have crept into the Church.' },
 
  // ── APOCALYPSE ──────────────────────────────────────────────────────────────
  66: { fr: 'La victoire finale de Christ sur le mal et la gloire éternelle.', en: 'The final victory of Christ over evil and the eternal glory to come.' },
};

function SectionHeader({ label, isOT }: { label: string; isOT: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, isOT ? styles.lineOT : styles.lineNT]} />
      <Text style={[styles.sectionLabel, isOT ? styles.labelOT : styles.labelNT]}>
        {label}
      </Text>
      <View style={[styles.sectionLine, isOT ? styles.lineOT : styles.lineNT]} />
    </View>
  );
}

function BookCard({
  item,
  lang,
  onPress,
}: {
  item: { book: number; name: string; chapters: number };
  lang: 'fr' | 'en';
  onPress: () => void;
}) {
  const rotate = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    rotate.value = withTiming(flipped ? 0 : 180, { duration: 420 });
    setFlipped(!flipped);
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: `${interpolate(
          rotate.value,
          [0, 180],
          [0, 180],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: `${interpolate(
          rotate.value,
          [0, 180],
          [180, 360],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    backfaceVisibility: 'hidden',
  }));

  const isOT = item.book <= 39;
  const summary =
    BOOK_SUMMARIES[item.book]?.[lang] ??
    (lang === 'fr'
      ? 'Résumé du livre biblique.'
      : 'Summary of the biblical book.');

  return (
    <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
      <Animated.View style={[styles.card, frontStyle]}>
        <Image
          source={BOOK_IMAGES[item.book]}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        <View style={styles.cardOverlay} />

        {/*<View style={[styles.badge, isOT ? styles.badgeOT : styles.badgeNT]}>
          <Text style={styles.badgeText}>{item.book}</Text>
        </View>*/}

        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          backStyle,
          isOT ? styles.backOT : styles.backNT,
        ]}
      >
        <Text style={styles.backTitle}>{item.name}</Text>

        <View style={[styles.divider, isOT ? styles.dividerOT : styles.dividerNT]} />

        <Text style={styles.backSummary}>{summary}</Text>

        <Text style={styles.backChapters}>
          {item.chapters} {lang === 'fr' ? 'chapitres' : 'chapters'}
        </Text>

        <TouchableOpacity
          style={[styles.readBtn, isOT ? styles.readBtnOT : styles.readBtnNT]}
          onPress={onPress}
        >
          <Text style={styles.readBtnText}>
            {lang === 'fr' ? 'Lire →' : 'Read →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.flipHint}>↺ retourner</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function LivresScreen() {
  const { lang } = useBible();
  const router = useRouter();

  const books = useMemo(() => getBooks(lang), [lang]);

  const oldTestament = useMemo(
    () => books.filter((book) => book.book <= 39),
    [books]
  );

  const newTestament = useMemo(
    () => books.filter((book) => book.book >= 40),
    [books]
  );

  const goToBook = useCallback(
    (bookNum: number) => {
      router.push({
        pathname: '/lecture/[livre]/[chapitre]',
        params: { livre: bookNum, chapitre: 1 },
      });
    },
    [router]
  );

  const renderBook = ({ item }: { item: (typeof books)[0] }) => (
    <BookCard item={item} lang={lang} onPress={() => goToBook(item.book)} />
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: lang === 'fr' ? 'La Bible' : 'The Bible',
          headerStyle: { backgroundColor: 'wheat' },
          headerTintColor: '#5C3D0E',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
              <Text style={styles.backHeader}>← Retour</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          label={lang === 'fr' ? 'Ancien Testament' : 'Old Testament'}
          isOT={true}
        />

        <FlatList
          data={oldTestament}
          keyExtractor={(item) => String(item.book)}
          renderItem={renderBook}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />

        <SectionHeader
          label={lang === 'fr' ? 'Nouveau Testament' : 'New Testament'}
          isOT={false}
        />

        <FlatList
          data={newTestament}
          keyExtractor={(item) => String(item.book)}
          renderItem={renderBook}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'wheat',
    flex: 1,
  },

  list: {
    padding: 12,
    paddingBottom: 40,
  },

  row: {
    gap: 12,
    marginBottom: 12,
  },

  backHeader: {
    fontSize: 16,
    color: '#5C3D0E',
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 18,
    gap: 10,
  },

  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },

  lineOT: {
    backgroundColor: '#C9922A',
  },

  lineNT: {
    backgroundColor: '#3A9BD5',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  labelOT: {
    color: '#C9922A',
  },

  labelNT: {
    color: '#3A9BD5',
  },

  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeOT: {
    backgroundColor: 'rgba(201,146,42,0.9)',
  },

  badgeNT: {
    backgroundColor: 'rgba(58,155,213,0.9)',
  },

  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign:"center",
  },

  cardHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
  },

  cardBack: {
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  backOT: {
    backgroundColor: '#1A1205',
  },

  backNT: {
    backgroundColor: '#05101A',
  },

  backTitle: {
    color: '#F0E6CC',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  divider: {
    width: 36,
    height: 2,
    borderRadius: 1,
  },

  dividerOT: {
    backgroundColor: '#C9922A',
  },

  dividerNT: {
    backgroundColor: '#3A9BD5',
  },

  backSummary: {
    color: '#9A8870',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  backChapters: {
    color: '#5A5040',
    fontSize: 11,
  },

  readBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },

  readBtnOT: {
    backgroundColor: '#7A5C10',
  },

  readBtnNT: {
    backgroundColor: '#0F4C7A',
  },

  readBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  flipHint: {
    color: '#3A3028',
    fontSize: 9,
  },
});