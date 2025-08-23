/**
 * Utilidades para el manejo de cadenas de texto
 */

/**
 * Limpia una cadena de texto eliminando caracteres no permitidos en nombres de archivo
 * 
 * @param string - Cadena de texto a limpiar
 * @returns Cadena de texto limpia
 */
export function cleanStrings(string: string): string {
  // Lista de caracteres no deseados en nombres de archivo
  const caracteresNoDeseados = /[<>:"/\\|?*]/g;
  
  // Reemplazar los caracteres no deseados con un espacio en blanco
  const stringLimpio = string.replace(caracteresNoDeseados, ' ');
  
  // Eliminar espacios adicionales al inicio y final
  return stringLimpio.trim();
}
