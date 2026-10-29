// Mini codec PNG (8 bits, sans entrelacement) pour les tests : aucune dépendance npm.
import {inflateSync,deflateSync} from 'node:zlib';
const TABLE=new Int32Array(256).map((_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n;});
const crc32=buf=>{let c=-1;for(const b of buf)c=TABLE[(c^b)&255]^(c>>>8);return (c^-1)>>>0;};
export function decode(buf){
 if(buf.readUInt32BE(0)!==0x89504e47)throw Error('Pas un PNG.');
 let pos=8,width=0,height=0,colorType=0,depth=0,interlace=0;const idat=[];
 while(pos<buf.length){const len=buf.readUInt32BE(pos),type=buf.toString('ascii',pos+4,pos+8),data=buf.subarray(pos+8,pos+8+len);pos+=12+len;
  if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];colorType=data[9];interlace=data[12];}else if(type==='IDAT')idat.push(data);else if(type==='IEND')break;}
 if(depth!==8||interlace!==0||![0,2,4,6].includes(colorType))throw Error('PNG non géré par le codec de test (8 bits, non entrelacé, sans palette).');
 const channels={0:1,2:3,4:2,6:4}[colorType],stride=width*channels,raw=inflateSync(Buffer.concat(idat)),out=new Uint8ClampedArray(width*height*4);
 let prev=Buffer.alloc(stride),cur;
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];cur=Buffer.from(raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)));
  for(let i=0;i<stride;i++){const a=i>=channels?cur[i-channels]:0,b=prev[i],c=i>=channels?prev[i-channels]:0;
   if(filter===1)cur[i]+=a;else if(filter===2)cur[i]+=b;else if(filter===3)cur[i]+=(a+b)>>1;else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);cur[i]+=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}}
  for(let x=0;x<width;x++){const s=x*channels,d=(y*width+x)*4;
   if(channels>=3){out[d]=cur[s];out[d+1]=cur[s+1];out[d+2]=cur[s+2];out[d+3]=channels===4?cur[s+3]:255;}else{out[d]=out[d+1]=out[d+2]=cur[s];out[d+3]=channels===2?cur[s+1]:255;}}
  prev=cur;}
 return {width,height,data:out};
}
export function encode({width,height,data}){
 const chunk=(type,body)=>{const t=Buffer.from(type,'ascii'),len=Buffer.alloc(4);len.writeUInt32BE(body.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,body])));return Buffer.concat([len,t,body,crc]);};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
 const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;raw.set(Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4),y*(width*4+1)+1);}
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
