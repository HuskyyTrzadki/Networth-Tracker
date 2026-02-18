async function main() {
  const accessKey = process.argv[2];

  if (!accessKey) {
    console.error('Usage: node temp.js <MARKETSTACK_API_KEY>');
    process.exit(1);
  }

  const url = new URL('https://api.marketstack.com/v2/eod');
  url.searchParams.set('access_key', accessKey);
  url.searchParams.set('symbols', 'PKN.WA');
  url.searchParams.set('sort', 'DESC');
  url.searchParams.set('limit', '10');
  // url.searchParams.set('date_from', '2026-02-01');
  // url.searchParams.set('date_to', '2026-02-18');

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data?.error) {
    const details = data?.error?.message ? ` - ${data.error.message}` : '';
    throw new Error(`EOD request failed (${res.status})${details}`);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
