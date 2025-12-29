import { Plugin } from '../types';

/**
 * Service for downloading plugin preview images from the internet
 * Uses various strategies to find accurate plugin screenshots
 */

interface ImageSearchResult {
  url: string;
  source: string;
  confidence: number;
}

/**
 * Search for plugin screenshot using manufacturer website patterns
 * This is the most reliable source for actual plugin screenshots
 */
const searchManufacturerWebsite = async (pluginName: string): Promise<ImageSearchResult | null> => {
  // Common manufacturer patterns and their image paths
  const manufacturers = [
    { name: 'fabfilter', domain: 'fabfilter.com', pattern: /fabfilter|pro-[qrlmc]/i },
    { name: 'xfer', domain: 'xferrecords.com', pattern: /serum|nerve/i },
    { name: 'native-instruments', domain: 'native-instruments.com', pattern: /kontakt|massive|reaktor/i },
    { name: 'arturia', domain: 'arturia.com', pattern: /arturia|mini|v collection/i },
    { name: 'izotope', domain: 'izotope.com', pattern: /ozone|neutron|rx/i },
    { name: 'waves', domain: 'waves.com', pattern: /waves|ssl|cla/i },
    { name: 'spectrasonics', domain: 'spectrasonics.net', pattern: /omnisphere|trilian|stylus/i },
  ];

  for (const mfr of manufacturers) {
    if (mfr.pattern.test(pluginName)) {
      // Return a placeholder result with high confidence
      // In production, this would make actual HTTP requests
      return {
        url: `https://${mfr.domain}/products/${pluginName.toLowerCase().replace(/\s+/g, '-')}/screenshot.png`,
        source: mfr.domain,
        confidence: 0.9
      };
    }
  }

  return null;
};

/**
 * Search for plugin images using web search
 * Falls back when manufacturer site doesn't have the image
 */
const searchWebImages = async (pluginName: string): Promise<ImageSearchResult | null> => {
  // This would integrate with a real image search API
  // For now, return null to indicate no results
  return null;
};

/**
 * Download image from URL and convert to blob
 */
const downloadImage = async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error);
    return null;
  }
};

/**
 * Save image blob to the plugin's directory
 */
const saveImageToPlugin = async (
  plugin: Plugin,
  imageBlob: Blob,
  filename: string = 'preview.png'
): Promise<boolean> => {
  try {
    if (!plugin.parentHandle) {
      console.error('Plugin has no parent handle');
      return false;
    }

    // Create the image file in the plugin's directory
    const fileHandle = await plugin.parentHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(imageBlob);
    await writable.close();

    console.log(`Saved image for plugin: ${plugin.name}`);
    return true;
  } catch (error) {
    console.error(`Failed to save image for ${plugin.name}:`, error);
    return false;
  }
};

/**
 * Main function to find and download plugin screenshot
 * Returns true if successful, false otherwise
 */
export const downloadPluginScreenshot = async (
  plugin: Plugin,
  onProgress?: (message: string) => void
): Promise<boolean> => {
  try {
    onProgress?.(` Searching for ${plugin.name}...`);

    // Strategy 1: Check manufacturer website
    let result = await searchManufacturerWebsite(plugin.name);
    
    // Strategy 2: Fall back to web search if manufacturer not found
    if (!result) {
      onProgress?.(`  Searching web for ${plugin.name}...`);
      result = await searchWebImages(plugin.name);
    }

    if (!result) {
      onProgress?.(`  No image found for ${plugin.name}`);
      return false;
    }

    onProgress?.(`  Downloading from ${result.source}...`);
    const imageBlob = await downloadImage(result.url);

    if (!imageBlob) {
      onProgress?.(`  Failed to download image for ${plugin.name}`);
      return false;
    }

    // Save with plugin name as filename
    const filename = `${plugin.name}.png`;
    const success = await saveImageToPlugin(plugin, imageBlob, filename);

    if (success) {
      onProgress?.(`  Downloaded image for ${plugin.name}`);
    }

    return success;
  } catch (error) {
    console.error(`Error downloading screenshot for ${plugin.name}:`, error);
    return false;
  }
};

/**
 * Download screenshots for multiple plugins
 */
export const downloadPluginScreenshots = async (
  plugins: Plugin[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ successful: number; failed: number }> => {
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    
    // Skip if plugin already has an image
    const hasImage = plugin.assets.some(a => a.type === 'png');
    if (hasImage) {
      onProgress?.(i + 1, plugins.length, `Skipped ${plugin.name} (already has image)`);
      continue;
    }

    const success = await downloadPluginScreenshot(plugin, (msg) => {
      onProgress?.(i + 1, plugins.length, msg);
    });

    if (success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed };
};
