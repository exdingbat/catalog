export const getLego = (path) => `https://www.lego.com/en-us/product/${path}`;
export const getBrickset = (id, variant) =>
  `https://brickset.com/sets/${id}-${variant}`;
export const getBricklink = (id, variant) =>
  `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${id}-${variant}#T=S&O={%22ss%22:%22US%22,%22ii%22:0,%22reg%22:%223%22,%22rpp%22:%22500%22,%22iconly%22:0}`;
export const getImg = (id, variant = 1) => `/images/${id}-${variant}_med.webp`;

export const getDate = (arg) => {
  const [day, month, year] = arg.split(" ").shift().split("/");
  return day && month && year ? new Date([year, month, day].join("-")) : null;
};
