/**
 * Utilities for string handling
 */

/**
 * Cleans a string by removing characters not allowed in file names
 *
 * @param string - String to clean
 * @returns Clean string
 */
export function cleanStrings(string: string): string {
  // List of unwanted characters in file names
  const unwantedChars = /[<>:"/\\|?*]/g

  // Replace unwanted characters with a space
  const cleanString = string.replace(unwantedChars, ' ')

  // Remove extra spaces at the beginning and end
  return cleanString.trim()
}
