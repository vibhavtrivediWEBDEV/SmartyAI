/**
 * Music Library - Sample songs for the Music app
 * In production, these would come from a music API or user's library
 */

export interface Song {
  id: number
  title: string
  artist: string
  src: string
  img: string
  duration?: string
  album?: string
}

export const songs: Song[] = [
  { 
    id: 1,
    title: "Blinding Lights", 
    artist: "The Weeknd", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/14/e3/9214e352-3322-3708-4903-cf5059c4985f/21UM1IM58861.rgb.jpg/500x500bb.jpg",
    duration: "3:20",
    album: "After Hours"
  },
  { 
    id: 2,
    title: "Levitating", 
    artist: "Dua Lipa", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9e/26/86/9e268670-6f4c-c2f3-794a-7a3775c81749/190296421112.jpg/500x500bb.jpg",
    duration: "3:23",
    album: "Future Nostalgia"
  },
  { 
    id: 3,
    title: "Save Your Tears", 
    artist: "The Weeknd", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/14/e3/9214e352-3322-3708-4903-cf5059c4985f/21UM1IM58861.rgb.jpg/500x500bb.jpg",
    duration: "3:35",
    album: "After Hours"
  },
  { 
    id: 4,
    title: "Peaches", 
    artist: "Justin Bieber", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/500x500bb.jpg",
    duration: "3:18",
    album: "Justice"
  },
  { 
    id: 5,
    title: "good 4 u", 
    artist: "Olivia Rodrigo", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a8/e2/1b/a8e21b3b-9c8d-2974-2318-6bcd4c9d2370/075679884336.jpg/500x500bb.jpg",
    duration: "2:59",
    album: "SOUR"
  },
  { 
    id: 6,
    title: "Stay", 
    artist: "The Kid LAROI & Justin Bieber", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ad/e9/99/ade999c7-ba3e-433a-baf2-9c4cf60ee9d8/849486085824_cover.jpg/500x500bb.jpg",
    duration: "2:21",
    album: "F*ck Love 3"
  },
  { 
    id: 7,
    title: "Montero", 
    artist: "Lil Nas X", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/500x500bb.jpg",
    duration: "2:17",
    album: "Montero"
  },
  { 
    id: 8,
    title: "Watermelon Sugar", 
    artist: "Harry Styles", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/99/20/18/992018eb-25c1-5b88-733a-b2444eb20810/24UMGIM34897.rgb.jpg/500x500bb.jpg",
    duration: "2:54",
    album: "Fine Line"
  },
  { 
    id: 9,
    title: "Dynamite", 
    artist: "BTS", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/500x500bb.jpg",
    duration: "3:19",
    album: "BE"
  },
  { 
    id: 10,
    title: "positions", 
    artist: "Ariana Grande", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/500x500bb.jpg",
    duration: "2:52",
    album: "Positions"
  },
  { 
    id: 11,
    title: "drivers license", 
    artist: "Olivia Rodrigo", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a8/e2/1b/a8e21b3b-9c8d-2974-2318-6bcd4c9d2370/075679884336.jpg/500x500bb.jpg",
    duration: "4:02",
    album: "SOUR"
  },
  { 
    id: 12,
    title: "Kiss Me More", 
    artist: "Doja Cat ft. SZA", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9e/26/86/9e268670-6f4c-c2f3-794a-7a3775c81749/190296421112.jpg/500x500bb.jpg",
    duration: "3:29",
    album: "Planet Her"
  },
]

/**
 * Recommended playlists
 */
export const playlists = [
  {
    id: 'today-hits',
    name: "Today's Hits",
    description: 'The biggest songs right now',
    songs: [1, 2, 3, 4, 5, 6, 7],
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/14/e3/9214e352-3322-3708-4903-cf5059c4985f/21UM1IM58861.rgb.jpg/500x500bb.jpg'
  },
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    description: 'Relax and unwind',
    songs: [8, 9, 10, 11, 12],
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/99/20/18/992018eb-25c1-5b88-733a-b2444eb20810/24UMGIM34897.rgb.jpg/500x500bb.jpg'
  },
  {
    id: 'workout-mix',
    name: 'Workout Mix',
    description: 'Get pumped up',
    songs: [3, 5, 7, 9, 1],
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ad/e9/99/ade999c7-ba3e-433a-baf2-9c4cf60ee9d8/849486085824_cover.jpg/500x500bb.jpg'
  }
]

/**
 * Recently played songs
 */
export const recentlyPlayed = [1, 7, 3, 8, 2]
