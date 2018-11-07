package mcc.mymcc2;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Comparator;
import java.util.Date;

public class Photo
{
    public String url;
    public String author;
    public Date date;

    public Photo(String url, String author, String date) throws ParseException
    {
        this.url = url;
        this.author = author;
        this.date = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").parse(date);
    }

    public static final Comparator<Photo> ORDER_ASCENDING = new Comparator<Photo>() {
        @Override
        public int compare(Photo a, Photo b)
        {
            return a.author.compareTo(b.author);
        }
    };

    public static final Comparator<Photo> ORDER_DESCENDING = new Comparator<Photo>() {
        @Override
        public int compare(Photo a, Photo b)
        {
            return -a.author.compareTo(b.author);
        }
    };

    public static final Comparator<Photo> ORDER_RECENT = new Comparator<Photo>() {
        @Override
        public int compare(Photo a, Photo b)
        {
            return -a.date.compareTo(b.date);
        }
    };
}
