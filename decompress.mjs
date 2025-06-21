export async function decompress(compressedData, encoding = "gzip") {
  const cs = new DecompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(compressedData);
  writer.close();
  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
}
