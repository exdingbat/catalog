export const getLego = (id) => `https://www.lego.com/en-us/product/${id}`;
export const getBrickset = (id) => `https://brickset.com/sets/${id}`;
export const getBricklink = (id) =>
  `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${id}#T=S&O={%22ss%22:%22US%22,%22ii%22:0,%22reg%22:%223%22,%22rpp%22:%22500%22,%22iconly%22:0}`;
export const getImg = (id = 1) => `http://127.0.0.1:6969/images/${id}_med.webp`;

export const getDate = (arg) => {
  const [day, month, year] = arg.split(" ").shift().split("/");
  return day && month && year ? new Date([year, month, day].join("-")) : null;
};
