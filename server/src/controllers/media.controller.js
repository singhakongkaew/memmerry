const crypto = require('crypto');
const { put } = require('@vercel/blob');

async function uploadImage(req, res, next, folder) {
  try {
    const dataUrl = req.body.image;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return res.status(400).json({ message: 'A valid image is required.' });
    const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!match) return res.status(400).json({ message: 'Use a JPEG, PNG, or WebP image.' });
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const filename = `${folder}/${crypto.randomUUID()}.${extension}`;
    const blob = await put(filename, Buffer.from(match[2], 'base64'), {
      access: 'public',
      addRandomSuffix: false,
      contentType: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`,
    });
    res.status(201).json({ imageUrl: blob.url });
  } catch (error) { next(error); }
}

exports.uploadMemoryImage = (req, res, next) => uploadImage(req, res, next, `couples/${req.user.coupleId}`);
exports.uploadProfileImage = (req, res, next) => uploadImage(req, res, next, `users/${req.user.id}`);
