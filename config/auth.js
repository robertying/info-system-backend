/**
 * 服务器配置
 */

module.exports = {
  secret: process.env.SECRET || "electron" // 用于 jwt 的 HAMC 公钥
};
