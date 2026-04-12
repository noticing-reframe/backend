/**
 * 스트리밍 청크를 버퍼링하여 문장 단위로 줄바꿈을 삽입하는 나이브 문장 분리기.
 * 문장 종결 부호(.?!…) 뒤에 공백이 오면 문장 경계로 판단한다.
 */
export class SentenceSplitBuffer {
  private buffer = '';

  processChunk(chunk: string, emit: (text: string) => void): void {
    this.buffer += chunk;
    this.drain(emit);
  }

  flush(emit: (text: string) => void): void {
    if (this.buffer) {
      emit(this.buffer);
      this.buffer = '';
    }
  }

  private drain(emit: (text: string) => void): void {
    const re = /([.!?…]+)\s+/g;
    let lastIndex = 0;
    let match;
    let output = '';

    while ((match = re.exec(this.buffer)) !== null) {
      output += this.buffer.slice(lastIndex, match.index + match[1].length) + '\n';
      lastIndex = match.index + match[0].length;
    }

    if (output) {
      emit(output);
      this.buffer = this.buffer.slice(lastIndex);
    }
  }
}
