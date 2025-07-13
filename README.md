# Play the Inversion 🎹

A web-based piano training app that helps musicians learn to recognize and play chord inversions. This app is part of a suite of music education tools designed to improve piano skills through interactive practice.

## Features

- **Interactive Piano Keyboard**: Click on the virtual piano or use your real piano with microphone detection
- **Chord Inversion Training**: Practice root position, first inversion, and second inversion for all triad types
- **Visual Feedback**: Green highlights for correct notes, red for incorrect ones
- **Audio Reference**: Hear the first note of each inversion as a starting reference
- **Smart Hints**: After 5 seconds or 3 mistakes, get visual hints showing which note to play next
- **Comprehensive Coverage**: Supports Major, Minor, Diminished, and Augmented triads in all 12 keys

## How to Use

1. Select which root notes, chord types, and inversions you want to practice
2. Click "Start Practice" to begin
3. The app displays a chord name and inversion type
4. Play the correct chord in the specified inversion
5. Get immediate feedback on your performance
6. Complete all selected inversions to master the skill

## Technologies

- Vanilla JavaScript
- Web Audio API for sound synthesis
- Pitch detection for microphone input
- CSS3 animations
- No framework dependencies

## Local Development

Simply open `index.html` in a modern web browser. For microphone features, you may need to serve the files through a local server:

```bash
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000`

## Credits

Built as part of the music education suite by Aaron Design Studio. Based on the architecture of [Play the Chord](https://github.com/AaronDesignStudio/play-the-chord).

## License

MIT License - feel free to use and modify for educational purposes.