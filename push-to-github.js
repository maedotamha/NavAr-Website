const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = __dirname;
const owner = 'maedotamha';
const repo = 'NavAr-Website';
const branch = 'main';
const credential = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
if (credential.status !== 0) throw new Error('Unable to read GitHub credential');
const password = credential.stdout.split(/\r?\n/).find(line => line.startsWith('password='));
const token = password && password.slice('password='.length);
if (!token) throw new Error('No GitHub token available from credential manager');
async function gh(method, url, body){
  const response = await fetch('https://api.github.com' + url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type':'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) throw new Error(method + ' ' + url + ' failed: ' + response.status + ' ' + await response.text());
  return response.json();
}
function listFiles(dir, prefix = ''){
  const skip = new Set(['.git','node_modules','.next','.env','.env.local','push-to-github.js']);
  const entries = [];
  for (const name of fs.readdirSync(dir)){
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    const rel = prefix ? prefix + '/' + name : name;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) entries.push(...listFiles(full, rel));
    else entries.push(rel);
  }
  return entries;
}
(async()=>{
  const ref = await gh('GET', '/repos/' + owner + '/' + repo + '/git/ref/heads/' + branch);
  const headSha = ref.object.sha;
  const headCommit = await gh('GET', '/repos/' + owner + '/' + repo + '/git/commits/' + headSha);
  const baseTreeSha = headCommit.tree.sha;
  const existingTree = await gh('GET', '/repos/' + owner + '/' + repo + '/git/trees/' + baseTreeSha + '?recursive=1');
  const files = listFiles(root).sort();
  const fileSet = new Set(files);
  const tree = [];
  for (const item of existingTree.tree || []){
    if (item.type === 'blob' && !fileSet.has(item.path)) tree.push({ path:item.path, mode:'100644', type:'blob', sha:null });
  }
  for (const file of files){
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const blob = await gh('POST', '/repos/' + owner + '/' + repo + '/git/blobs', { content, encoding:'utf-8' });
    tree.push({ path:file, mode:'100644', type:'blob', sha:blob.sha });
  }
  const newTree = await gh('POST', '/repos/' + owner + '/' + repo + '/git/trees', { base_tree: baseTreeSha, tree });
  const commit = await gh('POST', '/repos/' + owner + '/' + repo + '/git/commits', { message:'Rebuild platform with Node backend and Next.js frontend', tree:newTree.sha, parents:[headSha] });
  await gh('PATCH', '/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch, { sha:commit.sha, force:false });
  console.log(JSON.stringify({ repo:owner + '/' + repo, branch, commit:commit.sha, url:commit.html_url, files:files.length }, null, 2));
})();
