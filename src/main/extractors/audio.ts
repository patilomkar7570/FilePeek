import * as mm from 'music-metadata';
import { AudioMetadata } from '../../shared/types';
import { formatDuration } from '../../shared/formatters';

export async function extractAudioMetadata(filePath: string): Promise<AudioMetadata> {
  const result: AudioMetadata = {
    durationSeconds: 0,
    durationFormatted: '00:00',
    codec: 'Unknown Audio',
  };

  try {
    const metadata = await mm.parseFile(filePath, { duration: true, skipCovers: false });
    const fmt = metadata.format;
    const common = metadata.common;

    if (fmt.duration) {
      result.durationSeconds = Math.round(fmt.duration * 10) / 10;
      result.durationFormatted = formatDuration(result.durationSeconds);
    }

    if (fmt.bitrate) {
      result.bitrateKbps = Math.round(fmt.bitrate / 1000);
    }

    if (fmt.sampleRate) {
      result.sampleRateHz = fmt.sampleRate;
    }

    if (fmt.numberOfChannels) {
      result.channels = fmt.numberOfChannels;
      result.channelLayout = fmt.numberOfChannels === 1 ? 'Mono' : fmt.numberOfChannels === 2 ? 'Stereo' : `${fmt.numberOfChannels} Channels`;
    }

    result.codec = fmt.codec || fmt.container || 'Audio';

    if (common.artist) result.artist = common.artist;
    if (common.album) result.album = common.album;
    if (common.title) result.title = common.title;
    if (common.genre && common.genre.length > 0) result.genre = common.genre.join(', ');
    if (common.year) result.year = common.year;
    if (common.track && common.track.no) result.trackNo = common.track.no;

    // Check cover art
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      const mime = pic.format || 'image/jpeg';
      result.coverArtUrl = `data:${mime};base64,${pic.data.toString('base64')}`;
    }
  } catch (err: any) {
    result.codec = 'Unparsed Audio Stream';
  }

  return result;
}
