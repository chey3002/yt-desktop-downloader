# YT Desktop Downloader

YT Desktop Downloader is a desktop application for downloading YouTube videos. Built with Electron, React, and Tailwind CSS.

## Features

- Search videos by URL
- Choose video format for download
- Maximum quality download button
- Modern and user-friendly interface
- Support for high-quality video and audio downloads


## Installation

### For Users
1. Download the latest installer from the releases section
2. Run the `yt-desktop-downloader-Setup-x.x.x.exe` file
3. Follow the installer instructions

### For Developers

1. Clone the repository:
```bash
git clone https://github.com/your-username/yt-desktop-downloader.git
cd yt-desktop-downloader
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
To start the application in development mode:
```bash
npm run dev
```

### Build Application
To build the application for production:
```bash
npm run build:win
```

The installer will be generated in the `dist` folder.

## Main Dependencies

- `@distube/ytdl-core`: For YouTube video downloads
- `ffmpeg-static`: For video and audio processing
- `ffprobe-static`: For multimedia file analysis
- `fluent-ffmpeg`: For multimedia file manipulation
- `react-hot-toast`: For notifications
- `react-loader-spinner`: For loading indicators

## Troubleshooting

If you encounter any errors while downloading videos, it might be due to:
1. YouTube API changes
2. Internet connection issues
3. Age or region restrictions on the video

In these cases, try:
- Updating the application to the latest version
- Checking your internet connection
- Trying with a different video

## Credits

- Created by SrChey
- Based on [Alexander Cleasby's tutorial](https://alexandercleasby.dev/blog/use-ffmpeg-electron) for FFMPEG integration

## Warning

Be careful when downloading videos in very high quality (4K, 8K, 120fps, HDR, etc.), as these files can be very large and require significant disk space and system resources.
