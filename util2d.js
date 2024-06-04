// 線分1 x1,y1-x2,y2, 線分2 x3,y3-x4,y4
export const getLinesIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
  // 線分1の方向ベクトル
  const dx1 = x2 - x1;
  const dy1 = y2 - y1;
  // 線分2の方向ベクトル
  const dx2 = x4 - x3;
  const dy2 = y4 - y3;

  const ret = (x, y) => {
    // 交点が線分2上にあるかどうかを確認
    if (y < Math.min(y3, y4) || y > Math.max(y3, y4)) return null;
    if (x < Math.min(x1, x2) || x > Math.max(x1, x2)) return null;
    // 交点が線分1上にあるかどうかを確認
    if (y < Math.min(y1, y2) || y > Math.max(y1, y2)) return null;
    if (x < Math.min(x3, x4) || x > Math.max(x3, x4)) return null;
    return [x, y];
  };

  const near0 = (n) => Math.abs(n) < 1e-13;

  // 線分1が垂直の場合
  if (near0(dx1)) {
    // 線分2も垂直であれば交点なし
    if (near0(dx2)) return null;
    // 線分2の傾き
    const m2 = dy2 / dx2;
    // 交点のx座標は線分1のx座標
    const x = x1;
    // 交点のy座標を求める
    const y = m2 * (x - x3) + y3;
    return ret(x, y);
  }

  // 線分2が垂直の場合
  if (near0(dx2)) {
    // 線分1の傾き
    const m1 = dy1 / dx1;
    // 交点のx座標は線分2のx座標
    const x = x3;
    // 交点のy座標を求める
    const y = m1 * (x - x1) + y1;
    return ret(x, y);
  }

  // 線分1の傾き
  const m1 = dy1 / dx1;
  // 線分2の傾き
  const m2 = dy2 / dx2;

  // 平行な場合は交点なし
  if (near0(m1 - m2)) return null;

  // 線分1のy切片
  const b1 = y1 - m1 * x1;
  // 線分2のy切片
  const b2 = y3 - m2 * x3;

  // 交点のx座標を求める
  const x = (b2 - b1) / (m1 - m2);
  // 交点のy座標を求める
  const y = m1 * x + b1;

  return ret(x, y);
};

export const getDistanceFromWall = (x, y, th, wx, wy, ww, wh) => {
  const lw = ww + wh;
  const lw2 = lw * lw;
  const x2 = x + Math.cos(th) * lw;
  const y2 = y + Math.sin(th) * lw;
  const getLen = (x3, y3, x4, y4) => {
    const i = getLinesIntersection(x, y, x2, y2, x3, y3, x4, y4);
    if (i === null) return lw2;
    const dx = i[0] - x;
    const dy = i[1] - y;
    return dx * dx + dy * dy;
  };
  const l1 = getLen(wx, wy, wx + ww, wy); // up
  const l2 = getLen(wx + ww, wy, wx + ww, wy + wh); // right
  const l3 = getLen(wx, wy + wh, wx + ww, wy + wh); // bottom
  const l4 = getLen(wx, wy, wx, wy + wh); // left
  const len = Math.min(l1, l2, l3, l4);
  return Math.sqrt(len);
};
