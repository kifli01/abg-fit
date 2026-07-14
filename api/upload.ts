import { put } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    import { put } from '@vercel/blob';

    // Server-side upload handler using @vercel/blob.put()
    // - accepts binary POST body
    // - expects x-file-name and content-type headers
    // - tries configured server-side write tokens (preferred env: BLOB_READ_WRITE_TOKEN)

    export default async function handler(req: any, res: any) {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const fileName = typeof req.headers['x-file-name'] === 'string' ? req.headers['x-file-name'] : 'upload.bin';
      const contentType = typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : 'application/octet-stream';

      async function readRequestBody(r: any): Promise<Uint8Array> {
        if (r.body && (r.body instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(r.body)))) {
          return r.body instanceof Uint8Array ? r.body : new Uint8Array(r.body);
        }

        if (typeof r.arrayBuffer === 'function') {
          try {
            const ab = await r.arrayBuffer();
            return new Uint8Array(ab);
          } catch {
            // fallthrough
          }
        }

        const chunks: any[] = [];
        try {
          for await (const chunk of r) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        } catch {
          // ignore streaming errors
        }

        if (chunks.length === 0) return new Uint8Array();
        return new Uint8Array(Buffer.concat(chunks));
      }

      try {
        const payload = await readRequestBody(req);
        if (!payload || payload.byteLength === 0) return res.status(400).json({ error: 'No file body provided' });

        // Preferred server env name: BLOB_READ_WRITE_TOKEN
        // Accept lists or alternative names for rotating tokens
        const singleNames = ['BLOB_READ_WRITE_TOKEN', 'VERCEL_BLOB_TOKEN', 'BLOB_TOKEN', 'BLOB_API_TOKEN', 'BLOB_WRITE_KEY'];
        const listNames = ['BLOB_READ_WRITE_TOKENS', 'VERCEL_BLOB_TOKENS'];

        const tokensFromLists = listNames.flatMap((n) => {
          const raw = process.env[n];
          if (!raw || typeof raw !== 'string') return [];
          return raw.split(',').map((s) => s.trim()).filter(Boolean);
        });

        const individual = singleNames.map((n) => process.env[n]).filter(Boolean) as string[];
        const tokenCandidates = [...tokensFromLists, ...individual];

        if (tokenCandidates.length === 0) {
          return res.status(500).json({
            error: 'Blob store configured but no write token found',
            guidance: 'Generate a Read/Read+Write token for your Vercel Blob store and set it as BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_TOKENS comma-separated). See https://vercel.com/docs/storage/vercel-blob',
          });
        }

        const errors: Array<{ idx: number; message: string }> = [];
        for (let i = 0; i < tokenCandidates.length; i++) {
          const token = tokenCandidates[i];
          try {
            const result = await put(fileName, Buffer.from(payload), {
              access: 'public',
              contentType,
              addRandomSuffix: false,
              token,
            });

            return res.status(200).json({ url: result.url, pathname: result.pathname, contentType: result.contentType, size: payload.byteLength });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`put() failed token[${i}]`, message);
            errors.push({ idx: i, message });
            continue;
          }
        }

        return res.status(500).json({ error: 'All write token attempts failed', details: errors });
      } catch (err) {
        console.error('upload handler error', err instanceof Error ? err.stack || err.message : String(err));
        return res.status(500).json({ error: 'Upload failed', message: err instanceof Error ? err.message : String(err) });
      }
    }
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`Vercel Blob put failed for token[${i}]`, message);
          errors.push({ tokenIndex: i, message });
          continue;
        }
      }

      console.error('All blob token candidates failed', errors);
      return res.status(500).json({
        error: 'All blob token candidates failed',
        attempts: errors.length,
        details: errors,
      });
    }

    // Fallback: return a relative uploads path for local/dev use when no blob token is configured.
    return res.status(200).json({
      url: `/uploads/${encodeURIComponent(fileName)}`,
      pathname: `/uploads/${encodeURIComponent(fileName)}`,
      contentType,
      size: payload.byteLength,
    });
  } catch (error) {
    console.error('Upload failed', error instanceof Error ? error.stack || error.message : error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
