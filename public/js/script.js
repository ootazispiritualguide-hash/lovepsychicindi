document.addEventListener('DOMContentLoaded', ()=> {
  const input = document.querySelector('input[name="banner_image"]');
  if (!input) return;
  input.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = function(){
      if (this.width !== 1200 || this.height !== 500) {
        alert('Warning: recommended image size is 1200 x 500 px. Current image: ' + this.width + 'x' + this.height);
      }
    };
    img.src = URL.createObjectURL(f);
  });
});
